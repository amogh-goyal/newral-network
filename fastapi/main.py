import asyncio
from web_scraper import scrape_class_central, genai
from topic_generator import get_topics_for_degree
from youtube_api import search_youtube
import pycountry
import json
import re


def sanitize_value(value):
    """Make sure all values are of hashable types by converting lists to tuples and dicts to strings"""
    if isinstance(value, list):
        return tuple(sanitize_value(item) for item in value)
    elif isinstance(value, dict):
        return str(value)  # Convert dict to string representation
    else:
        return value

def clean_dict(obj):
    """Recursively clean a dictionary to ensure all values are JSON serializable"""
    if isinstance(obj, dict):
        return {str(k): clean_dict(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_dict(item) for item in obj]
    elif isinstance(obj, tuple):
        return [clean_dict(item) for item in obj]  # Convert tuple to list for JSON
    elif isinstance(obj, (int, float, str, bool)) or obj is None:
        return obj
    else:
        return str(obj)  # Convert other types to string

async def generate_roadmap(degree, country=None, language='en', include_paid=True, preferred_language=None):
    """
    Generate a learning roadmap for a given degree or job role with optimized API calls.
    This implementation batches requests to minimize API calls and rate limits.
    
    Args:
        degree (str): The degree or job role to generate a roadmap for
        country (str, optional): User's country for region-specific content
        language (str, optional): Preferred language for content
        include_paid (bool, optional): Whether to include paid courses
        preferred_language (str, optional): Preferred programming language
        
    Returns:
        dict: Complete roadmap with topics and course options
    """
    roadmap = {
        "degree": str(degree),  # Ensure string
        "topics": []
    }
    
    # Step 1: Get all topics for the specified degree in a single call
    try:
        topics, is_programming_related = get_topics_for_degree(
            degree, 
            country=country, 
            preferred_language=preferred_language
        )
        print(f"Generated {len(topics)} topics for '{degree}'")
    except Exception as e:
        print(f"Error generating topics: {str(e)}")
        topics = [f"Topic {i+1}" for i in range(6)]  # Fallback topics
        is_programming_related = False
    
    # Step 2: Batch fetch all resources for all topics in parallel
    print(f"Starting batch fetch for all {len(topics)} topics")
    
    # Create coroutines for Class Central (async)
    class_central_coroutines = [scrape_class_central(topic) for topic in topics]
    
    # Execute Class Central scraping in parallel (async)
    all_class_central_results = await asyncio.gather(*class_central_coroutines, return_exceptions=True)
    
    # YouTube API is synchronous, so process normally
    all_youtube_results = []
    for topic in topics:
        try:
            # Direct call to search_youtube (no await)
            result = search_youtube(topic, language)
            all_youtube_results.append(result)
        except Exception as e:
            print(f"Error fetching YouTube content for {topic}: {str(e)}")
            all_youtube_results.append([])
    
    print(f"Completed batch fetch for all topics")
    
    # Step 3: Process results and build roadmap
    topic_descriptions = []
    
    for i, topic in enumerate(topics):
        topic_data = {
            "name": topic,
            "is_programming_related": is_programming_related,
            "options": []
        }
        
        # Process Class Central results for this topic
        if i < len(all_class_central_results) and isinstance(all_class_central_results[i], list):
            class_central_courses = all_class_central_results[i]
            print(f"Got {len(class_central_courses)} courses from Class Central for '{topic}'")
        else:
            class_central_courses = []
            if i < len(all_class_central_results):
                print(f"Class Central scraping failed for topic '{topic}': {str(all_class_central_results[i])}")
        
        # Process YouTube results for this topic
        if i < len(all_youtube_results) and isinstance(all_youtube_results[i], list):
            youtube_courses = all_youtube_results[i]
            print(f"Got {len(youtube_courses)} results from YouTube for '{topic}'")
            # Print the first YouTube result for debugging if there are results
            if len(youtube_courses) > 0:
                print(f"First YouTube result for '{topic}': {youtube_courses[0].get('course_name', 'Unnamed')}")
                print(f"URL: {youtube_courses[0].get('url', 'No URL')}")
                print(f"Thumbnail: {youtube_courses[0].get('thumbnail', 'No thumbnail')}")
        else:
            youtube_courses = []
            if i < len(all_youtube_results):
                # If it's an exception, print the exception details
                if isinstance(all_youtube_results[i], Exception):
                    print(f"YouTube API failed for topic '{topic}': {str(all_youtube_results[i])}")
                    import traceback
                    print(f"Error details: {traceback.format_exc()}")
                else:
                    print(f"YouTube API returned no results for topic '{topic}'")
                
                # Create fallback YouTube search link
                search_query = topic.replace(' ', '+')
                youtube_courses = [{
                    "course_name": f"YouTube search for {topic}",
                    "platform": "YouTube",
                    "description": f"Search results for {topic} on YouTube",
                    "url": f"https://www.youtube.com/results?search_query={search_query}",
                    "thumbnail": "https://www.gstatic.com/youtube/img/branding/youtubelogo/svg/youtubelogo.svg",
                    "thumbnail_alt": f"YouTube search for {topic}",
                    "views": "0",
                    "rating": "Not available",
                    "course_type": "Free",
                    "duration": "Various videos"
                }]
        
        # Ensure YouTube resources have all required fields
        for course in youtube_courses:
            if 'rating_value' not in course:
                course['rating_value'] = '0'
            if 'reviews_count' not in course:
                course['reviews_count'] = '0'
            if 'overview' not in course and 'description' in course:
                course['overview'] = course['description']
        
        # Combine both sources - prioritize YouTube content over generic fallbacks
        all_courses = []
        
        # Always add YouTube resources first when available (up to 3)
        if youtube_courses:
            # Make copies of course dictionaries to avoid reference issues
            for course in youtube_courses[:3]:
                all_courses.append(dict(course))
            
        # Then add Class Central resources if available
        if class_central_courses:
            # Make copies of course dictionaries to avoid reference issues
            for course in class_central_courses[:3-len(all_courses)]:
                all_courses.append(dict(course))
            
        # If we still need more courses, add more YouTube resources
        if len(all_courses) < 3 and len(youtube_courses) > 3:
            # Make copies of course dictionaries to avoid reference issues
            for course in youtube_courses[3:6-len(all_courses)]:
                all_courses.append(dict(course))
        
        # Process and select courses with Gemini API
        all_courses_with_scores = []
        
        # Add Class Central courses with source tracking
        for idx, course in enumerate(class_central_courses):
            course_copy = course.copy()
            course_copy["source"] = "ClassCentral"
            course_copy["source_index"] = idx
            all_courses_with_scores.append(course_copy)
        
        # Add YouTube courses with source tracking
        for idx, course in enumerate(youtube_courses):
            course_copy = course.copy()
            course_copy["source"] = "YouTube"
            course_copy["source_index"] = idx
            all_courses_with_scores.append(course_copy)
        
        # Only create fallback course if no courses found
        if not all_courses_with_scores:
            print(f"No resources found for topic '{topic}', creating fallback")
            fallback_course = {
                "course_name": f"Search for {topic}",
                "platform": "Multiple",
                "course_type": "Free",
                "url": f"https://www.google.com/search?q={topic.replace(' ', '+')}+course+tutorial",
                "thumbnail": "https://via.placeholder.com/300x200.png?text=Search+Resources",
                "thumbnail_alt": f"Search for {topic}",
                "overview": f"Find resources related to {topic} online",
                "description": f"Find resources related to {topic} online",
                "duration": "Varied",
                "rating_value": "4.0",
                "reviews_count": "0",
                "source": "Fallback",
                "source_index": 0,
                "relevance_score": 10  # High score to ensure selection
            }
            selected_resources = [fallback_course]
        else:
            # Manual selection method: prioritize Class Central over YouTube when possible
            selected_resources = []
            
            # Prioritize Class Central courses (2-3 spots)
            class_central_courses = [c for c in all_courses_with_scores if c["source"] == "ClassCentral"]
            class_central_other = [c for c in class_central_courses if c.get("platform", "").lower() not in ["coursera", "edx", "udacity", "harvard", "mit", "stanford"]]
            class_central_with_premium = [c for c in class_central_courses if c.get("platform", "").lower() in ["coursera", "edx", "udacity", "harvard", "mit", "stanford"]]
            youtube_courses = [c for c in all_courses_with_scores if c["source"] == "YouTube"]
            youtube_with_views = [c for c in youtube_courses if int(c.get("views", "0").replace(",", "")) > 10000]
            youtube_other = [c for c in youtube_courses if int(c.get("views", "0").replace(",", "")) <= 10000]
            
            for course in class_central_with_premium[:3]:  # Get up to 3 Class Central courses
                selected_resources.append(course)
            
            # Fill remaining spots with YouTube courses
            remaining_slots = 4 - len(selected_resources)
            for course in youtube_with_views[:remaining_slots]:
                selected_resources.append(course)
                
            # Ensure we have 4 resources in total
            remaining_courses = [c for c in all_courses_with_scores if c not in selected_resources]
            while len(selected_resources) < 4 and remaining_courses:
                selected_resources.append(remaining_courses.pop(0))
            
            # Set relevance scores for each resource based on its position
            for i, resource in enumerate(selected_resources):
                resource["relevance_score"] = 80 - (i * 10)
        
        # Generate an explanation for the selection
        source_types = []
        platforms = []
        for resource in selected_resources:
            if resource["source"] not in source_types:
                source_types.append(resource["source"])
            platform = resource.get("platform", "")
            if platform and platform not in platforms:
                platforms.append(platform)
        
        resources_explanation = f"These resources were selected because they are the most relevant for learning {topic}. "
        if "ClassCentral" in source_types and "YouTube" in source_types:
            resources_explanation += "They provide a mix of structured courses and video content for different learning styles. "
        if platforms:
            if len(platforms) > 1:
                resources_explanation += f"They come from reputable platforms including {', '.join(platforms[:-1])} and {platforms[-1]}. "
            else:
                resources_explanation += f"They come from {platforms[0]}, a reputable learning platform. "
        
        # Add the selected resources as options for this topic
        for option_index, course in enumerate(selected_resources):
            option = {
                "option_id": option_index + 1,
                "course_name": course["course_name"],
                "selected_course": course["course_name"],
                "platform": course.get("platform", "Not specified"),
                "course_type": course.get("course_type", "Free") if "course_type" in course else "Free",
                "duration": course.get("duration", "Not specified"),
                "url": course.get("url", "#"),
                "thumbnail": course.get("thumbnail", "https://via.placeholder.com/300x200.png?text=Resource"),
                "thumbnail_alt": course.get("thumbnail_alt", "Course thumbnail"),
                "rating_value": course.get("rating_value", "0"),
                "reviews_count": course.get("reviews_count", "0"),
                "overview": course.get("description", course.get("overview", "No overview available"))
            }
            topic_data["options"].append(option)
            
        # Log the resource selection process
        print(f"For topic '{topic}': Selected {len(selected_resources)} resources from {len(all_courses)} available")
        
        # Create a topic description
        topic_descriptions.append(f"Learn {topic} through carefully selected resources that cover both theory and practice.")
        
        # Add the topic to the roadmap
        roadmap["topics"].append(topic_data)
    
    # Create the final roadmap structure - following exact format required
    final_roadmap = {
        "title": f"Your Path to {degree} Mastery",
        "description": " ".join(topic_descriptions),
        "topic": degree.split()[0].lower(),  # One to two word topic (e.g., "web" from "Web Development")
        "selected_option": "1",  # Default selected option - IMPORTANT: should be a string
        "options": []
    }
    
    # Create options (different paths through the topics)
    for i in range(1, 5):  # Generate 4 options
        option_topics = []
        for step, topic_data in enumerate(roadmap["topics"], 1):
            # Find the right course option to use
            topic_options = topic_data["options"]
            option_index = min(i-1, len(topic_options)-1) if topic_options else 0
            
            if topic_options and option_index < len(topic_options):
                course = topic_options[option_index]
                # Create a new dictionary instead of using references to avoid unhashable type issues
                step_data = {
                    "step_number": step,  # Integer
                    "topic": str(topic_data["name"]),  # String
                    "thumbnail": str(course.get("thumbnail", "https://via.placeholder.com/300x200.png?text=Resource")),  # String
                    "url": str(course.get("url", "#")),  # String
                    "rating": str(course.get("rating_value", "4.0")),  # String
                    "reviews_count": str(course.get("reviews_count", "0")),  # String - should be a string!
                    "completed": False  # Boolean
                }
            else:
                # Fallback if no course options exist
                step_data = {
                    "step_number": step,  # Integer
                    "topic": str(topic_data["name"]),  # String
                    "thumbnail": "https://via.placeholder.com/300x200.png?text=Resource",  # String
                    "url": f"https://www.youtube.com/results?search_query={topic_data['name'].replace(' ', '+')}",  # String
                    "rating": "4.0",  # String
                    "reviews_count": "0",  # String
                    "completed": False  # Boolean
                }
            option_topics.append(step_data)
        
        final_roadmap["options"].append({
            "option_id": i,  # Integer (not string) as in the example
            "option_name": f"Option {i}",  # String
            "topics": option_topics  # Array
        })
    
    # Clean the entire roadmap to ensure all values are JSON serializable
    cleaned_roadmap = clean_dict(final_roadmap)
    return cleaned_roadmap


def get_region_code(country):
    """Convert country name to ISO region code"""
    if not country:
        return None
    try:
        return pycountry.countries.search_fuzzy(country)[0].alpha_2
    except LookupError:
        print(f"Country '{country}' not found.")
        return None


if __name__ == "__main__":
    async def main():
        roadmap = await generate_roadmap("Software Engineering", country="US", preferred_language="Python")
        print(json.dumps(roadmap, indent=2))

    asyncio.run(main())