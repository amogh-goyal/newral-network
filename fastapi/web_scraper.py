import asyncio
import os
import re
import json
from typing import List, Dict, Any, Tuple
from dotenv import load_dotenv
from crawl4ai import AsyncWebCrawler
import google.generativeai as genai

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = 'gemini-1.5-pro'  # Use pro model for batch processing

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)

async def batch_scrape_class_central(topics: List[str], num_courses_per_topic=5):
    """
    Batch scrape course details from Class Central for multiple topics efficiently.
    Process only the main search pages without fetching individual course detail pages.
    
    Args:
        topics (List[str]): List of topics to search for courses.
        num_courses_per_topic (int): Number of courses to scrape per topic (default: 5).
        
    Returns:
        Dict[str, List[Dict]]: Dictionary mapping each topic to its list of course dictionaries.
    """
    # Create a single crawler instance for all operations
    crawler = None
    
    try:
        print(f"Initializing crawler for batch scraping {len(topics)} topics")
        crawler = AsyncWebCrawler(
            verbose=True,
            headless=True,
            timeout=60  # Reasonable timeout for main pages
        )
        
        # Step 1: Fetch main search page markdown for all topics
        topic_markdowns = {}
        thumbnail_urls_by_topic = {}
        
        for topic in topics:
            # Replace spaces with %20 for URL encoding
            encoded_topic = topic.replace(" ", "%20")
            url = f"https://www.classcentral.com/search?q={encoded_topic}"
            
            try:
                print(f"Fetching search results for topic: {topic}")
                result = await crawler.arun(url=url)
                
                if hasattr(result, 'markdown') and result.markdown and len(result.markdown) > 100:
                    # Check if there's any YouTube content in the markdown
                    youtube_matches = re.findall(r'YouTube|youtube\.com|youtu\.be', result.markdown)
                    if youtube_matches:
                        print(f"Found {len(youtube_matches)} YouTube references in content for topic: {topic}")
                    
                    # Skip the header/filter section and focus on course listings
                    course_section_match = re.search(r'Show.*?Clear Filters(.*)', result.markdown, re.DOTALL)
                    if course_section_match:
                        course_section = course_section_match.group(1)
                        topic_markdowns[topic] = course_section
                        print(f"Extracted course section for topic: {topic}")
                        
                        # Double-check for YouTube content in the extracted section
                        youtube_in_section = re.findall(r'YouTube|youtube\.com|youtu\.be', course_section)
                        if youtube_in_section:
                            print(f"Found {len(youtube_in_section)} YouTube references in course section for topic: {topic}")
                        else:
                            print(f"No YouTube references in extracted course section for topic: {topic}")
                    else:
                        # Fallback to using the whole markdown if we can't find the course section
                        topic_markdowns[topic] = result.markdown
                        print(f"Using full markdown for topic: {topic}")
                    
                    # Extract thumbnail URLs using all known patterns
                    thumbnails = re.findall(r'!\[.*?\]\((https://d3f1iyfxxz8i1e\.cloudfront\.net/courses/course_image/[^\)]+)\)', result.markdown)
                    if not thumbnails:
                        # Fallback to direct URL pattern if markdown pattern doesn't work
                        thumbnails = re.findall(r'https://(?:[^\s)]+/course[_-]image/[^\s)]+\.(?:png|jpg|jpeg)|d3f1iyfxxz8i1e\.cloudfront\.net/courses/course_image/[^\s)]+\.(?:jpg|jpeg|png))', result.markdown)
                    
                    thumbnail_urls_by_topic[topic] = thumbnails
                    print(f"Found {len(thumbnails)} thumbnails for topic: {topic}")
                else:
                    print(f"Invalid or empty response received for topic: {topic}")
                    topic_markdowns[topic] = ""
                    thumbnail_urls_by_topic[topic] = []
            except Exception as e:
                print(f"Error fetching search results for topic {topic}: {e}")
                topic_markdowns[topic] = ""
                thumbnail_urls_by_topic[topic] = []
        
        # Step 2: Extract course details from all topic markdowns in a single Gemini API call
        all_courses = await extract_all_courses_from_markdowns(topic_markdowns, num_courses_per_topic, thumbnail_urls_by_topic)
        
        # Ensure all courses have the required fields with default values
        for topic, courses in all_courses.items():
            for course in courses:
                # Add default values for fields that would normally come from detail pages
                if 'rating_value' not in course:
                    course['rating_value'] = '3.5'  # Default rating
                if 'reviews_count' not in course:
                    course['reviews_count'] = '10'  # Default reviews count
                if 'rating' not in course:
                    course['rating'] = 'Not available'
                if 'overview' not in course or not course['overview']:
                    course['overview'] = f"Course about {topic}. Visit the course page for more details."
        
        return all_courses
    except Exception as e:
        print(f"Error in batch scraping: {e}")
        return {topic: get_fallback_courses(topic, num_courses_per_topic) for topic in topics}
    finally:
        # Ensure crawler is properly closed
        if crawler:
            try:
                print("Closing crawler instance")
                if hasattr(crawler, 'browser') and crawler.browser is not None:
                    if not crawler.browser._closed:
                        await crawler.close()
                        print("Crawler closed successfully")
                    else:
                        print("Browser already closed, skipping crawler.close()")
                else:
                    print("No active browser found, skipping crawler.close()")
            except Exception as e:
                print(f"Error closing crawler: {e}")

async def fetch_course_page(crawler, url):
    """
    Helper function to fetch a course page markdown.
    
    Args:
        crawler: The AsyncWebCrawler instance.
        url: The course URL to fetch.
        
    Returns:
        str: The markdown content of the course page.
    """
    try:
        result = await crawler.arun(url=url)
        if hasattr(result, 'markdown') and result.markdown:
            return result.markdown
        return ""
    except Exception as e:
        print(f"Error fetching course page {url}: {e}")
        return ""

def get_fallback_courses(topic, num_courses):
    """
    Generate fallback course data when scraping fails.
    
    Args:
        topic (str): The search topic.
        num_courses (int): Number of courses to generate.
        
    Returns:
        list: List of fallback course dictionaries.
    """
    return [
        {
            "course_name": f"{topic} Course {i}",
            "platform": "Class Central",
            "course_type": "Not available",
            "duration": "Not available",
            "overview": "Course details temporarily unavailable",
            "url": "https://www.classcentral.com",
            "thumbnail": f"https://via.placeholder.com/300x200.png?text={topic.replace(' ', '+')}+Course+{i}",
            "thumbnail_alt": f"{topic} Course {i} thumbnail",
            "rating": "Not available",
            "rating_value": "3.5",  # Default rating for fallback
            "reviews_count": "10"    # Default reviews count for fallback
        } for i in range(1, num_courses + 1)
    ]

async def extract_all_courses_from_markdowns(topic_markdowns, num_courses_per_topic, thumbnail_urls_by_topic):
    """
    Extract comprehensive course details from multiple topic markdowns using a single Gemini API call.
    Optimized to extract as much information as possible from the main search pages without visiting course pages.
    
    Args:
        topic_markdowns (Dict[str, str]): Dictionary mapping topic to its markdown content
        num_courses_per_topic (int): Number of courses to extract per topic
        thumbnail_urls_by_topic (Dict[str, List[str]]): Dictionary mapping topic to its thumbnail URLs
    
    Returns:
        Dict[str, List[Dict]]: Dictionary mapping topic to its list of course dictionaries
    """
    # Filter out topics with empty markdown content
    valid_topic_markdowns = {k: v for k, v in topic_markdowns.items() if v and len(v) > 100}
    
    if not valid_topic_markdowns:
        print("No valid markdowns to process")
        return {topic: [] for topic in topic_markdowns.keys()}
    
    # Construct a prompt to extract courses for all topics in a single call
    prompt = """
    Extract comprehensive information for courses from the following Class Central search results.
    For each search topic, extract information for the specified number of courses.
    
    Pay special attention to the Class Central markdown structure. Here are EXACT examples of what the course listings look like:

    ```
    1. [ ![Modern React Tutorial](https://d3f1iyfxxz8i1e.cloudfront.net/courses/course_image/83158888fa94.jpg) ](https://www.classcentral.com/classroom/youtube-full-modern-react-tutorial-45814)
    [ Net Ninja ](https://www.classcentral.com/institution/netninja) ## [Modern React Tutorial ](https://www.classcentral.com/classroom/youtube-full-modern-react-tutorial-45814) [ 35 reviews ](https://www.classcentral.com/classroom/youtube-full-modern-react-tutorial-45814)
    [ Hey gang, in this full React tutorial series, I'll take you from novice to ninja. We'll cover all the basics - what React is, setting up, components & routing - before diving into state management, async code, built-in hooks & custom hooks too. ](https://www.classcentral.com/classroom/youtube-full-modern-react-tutorial-45814)
    Add to list 
        * [ YouTube ](https://www.classcentral.com/provider/youtube "List of YouTube MOOCs")
        * 3 hours 30 minutes 
        * On-Demand 
        * Free Video 
    ```

    ```
    2. [ ![Modern React with Redux \[2024 Update\]](https://d3f1iyfxxz8i1e.cloudfront.net/courses/course_image/a0506c47cdce.jpg) ](https://www.classcentral.com/course/udemy-react-redux-23704)
    ## [Modern React with Redux [2024 Update] ](https://www.classcentral.com/course/udemy-react-redux-23704) [ 88169 ratings at Udemy ](https://www.classcentral.com/course/udemy-react-redux-23704)
    [ Master React and Redux. Apply modern design patterns to build apps with React Router, TailwindCSS, Context, and Hooks! ](https://www.classcentral.com/course/udemy-react-redux-23704)
    Add to list 
        * [ Udemy ](https://www.classcentral.com/provider/udemy "List of Udemy MOOCs")
        * 3 days 3 hours 42 minutes 
        * On-Demand 
        * Paid Course 
    ```
    
    For each numbered course entry (1., 2., etc.), extract ALL of the following information:

    1. course_name (the exact title, e.g. "Modern React Tutorial" or "Modern React with Redux [2024 Update]")
    2. platform (the platform shown in bullet points, e.g., "YouTube", "Udemy")
    3. course_type (the last bullet point, e.g., "Free Video", "Paid Course")
    4. duration (the time shown in bullet points, e.g., "3 hours 30 minutes", "3 days 3 hours 42 minutes")
    5. overview (the description text in square brackets after the title)
    6. url (the URL in the first link of each course - after the thumbnail image)
    7. instructors (if shown, like "Net Ninja")
    8. reviews_count (number of reviews, e.g. "35" from "35 reviews" or "88169" from "88169 ratings at Udemy")
    9. thumbnail (the exact URL in the image link, e.g., "https://d3f1iyfxxz8i1e.cloudfront.net/courses/course_image/83158888fa94.jpg")
    
    CRITICAL INSTRUCTIONS: 
    - Each course starts with a number followed by a period (e.g., "1." or "2.")
    - The pattern is very consistent: thumbnail link -> instructor/institution -> course title -> review count -> description -> bullet points
    - The bullet points always contain: platform, duration, availability ("On-Demand"), and course type ("Free Video", "Paid Course")
    - Extract the EXACT thumbnail URL from the image link - it will be a cloudfront.net URL
    - ALWAYS get the full course URL from the first link in each course listing (the link that contains the thumbnail)
    - PAY SPECIAL ATTENTION to YouTube content - these will have "YouTube" in the platform field and "Free Video" in the course type
    - For any course where the platform is YouTube, make sure to label it as a YouTube video in the course_type field
    - If information truly isn't available in the listing, use "Not available" as the value
    
    Return the data as a valid JSON object where each key is the search topic and each value is an array of course objects containing ALL the above fields.

    Be extremely accurate and precise in your extraction - the data is consistently formatted in the listings.
    
    Here are the search results for different topics:
    """
    
    # Add each topic's markdown content to the prompt
    for topic, markdown in valid_topic_markdowns.items():
        # Truncate to avoid token limit issues
        truncated_markdown = markdown[:12000] if len(markdown) > 12000 else markdown
        prompt += f"\n\nTOPIC: {topic}\nNumber of courses to extract: {num_courses_per_topic}\n\n{truncated_markdown}\n"
    
    try:
        # Call Gemini API
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        
        # Extract valid JSON from response text
        response_text = response.text
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        
        all_courses = {}
        
        if json_match:
            try:
                parsed_data = json.loads(json_match.group(0))
                print(f"Successfully extracted courses data for {len(parsed_data)} topics")
                
                # Process each topic's courses
                for topic, courses in parsed_data.items():
                    valid_courses = []
                    
                    for i, course in enumerate(courses[:num_courses_per_topic]):
                        # Ensure required fields exist
                        if 'course_name' not in course or not course['course_name']:
                            continue
                        
                        # Fix relative URLs
                        if 'url' in course and course['url']:
                            if not course['url'].startswith('http'):
                                if course['url'].startswith('/'):
                                    course['url'] = f"https://www.classcentral.com{course['url']}"
                                else:
                                    course['url'] = f"https://www.classcentral.com/{course['url']}"
                        
                        # Handle thumbnails - prioritize the ones extracted by Gemini API if available
                        if 'thumbnail' in course and course['thumbnail'] and course['thumbnail'].startswith('http'):
                            # Use the thumbnail extracted by Gemini
                            pass
                        elif topic in thumbnail_urls_by_topic and i < len(thumbnail_urls_by_topic[topic]):
                            # Use the thumbnail from our regex extraction
                            course['thumbnail'] = thumbnail_urls_by_topic[topic][i]
                        else:
                            # Use a placeholder
                            course_name_slug = course['course_name'].replace(' ', '+')
                            course['thumbnail'] = f"https://via.placeholder.com/300x200.png?text={course_name_slug}"
                        
                        # Ensure thumbnail_alt is set
                        if 'thumbnail_alt' not in course:
                            course['thumbnail_alt'] = f"{course['course_name']} thumbnail"
                        
                        # Set any missing fields with default values
                        for field in ['rating', 'rating_value', 'reviews_count', 'overview', 'duration', 
                                     'course_type', 'level', 'instructors', 'subject', 'start_date']:
                            if field not in course or not course[field]:
                                if field == 'rating_value':
                                    course[field] = '3.5'  # Default rating value
                                elif field == 'reviews_count':
                                    course[field] = '10'   # Default reviews count
                                elif field == 'instructors':
                                    course[field] = []     # Empty list for instructors
                                else:
                                    course[field] = "Not available"
                        
                        # Ensure rating is properly formatted if we have rating_value but no rating
                        if course['rating'] == "Not available" and course['rating_value'] != "Not available":
                            course['rating'] = f"{course['platform']} Rating: {course['rating_value']} ({course['reviews_count']} ratings)"
                        
                        valid_courses.append(course)
                    
                    all_courses[topic] = valid_courses
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON from Gemini response: {e}")
        else:
            print("No valid JSON object found in Gemini response")
        
        # For any topics that weren't in the response or failed to parse,
        # use regex fallback method
        for topic in topic_markdowns.keys():
            if topic not in all_courses and topic in topic_markdowns and topic_markdowns[topic]:
                print(f"Using fallback regex method for topic: {topic}")
                thumbnail_urls = thumbnail_urls_by_topic.get(topic, [])
                all_courses[topic] = extract_courses_with_regex(
                    topic_markdowns[topic], 
                    num_courses_per_topic,
                    thumbnail_urls
                )
            elif topic not in all_courses:
                all_courses[topic] = []
        
        return all_courses
    except Exception as e:
        print(f"Error in batch course extraction: {e}")
        # Return empty lists for all topics
        return {topic: [] for topic in topic_markdowns.keys()}

async def extract_all_course_details(url_to_markdown):
    """
    Extract detailed course information for multiple course pages using a single Gemini API call.
    
    Args:
        url_to_markdown (Dict[str, str]): Dictionary mapping course URL to its markdown content
        
    Returns:
        Dict[str, Dict]: Dictionary mapping course URL to its details dictionary
    """
    # Filter out empty markdowns
    valid_url_markdowns = {k: v for k, v in url_to_markdown.items() if v and len(v) > 100}
    
    if not valid_url_markdowns:
        print("No valid course page markdowns to process")
        return {}
    
    # Construct a prompt to extract details for all courses in a single call
    prompt = """
    Extract the following specific information from these course page markdown contents.
    For each course page:
    
    1. Rating: Look for rating information, especially in format "**X.X** rating at **Platform** based on **N** ratings" 
       where X.X is the rating value, Platform is the platform name, and N is the number of ratings.
       Pay attention to bold markdown (**) that may surround these values.
    
    2. Overview: Extract a comprehensive course overview or description.
    
    Return the data as a valid JSON object where each key is the course URL and each value is a JSON object with these fields:
    - rating: Format as "Platform Rating: X.X (N ratings)" - use the actual platform name, not Class Central
    - overview: The course description
    
    If any information is not found, use "Not available" as the value.
    
    Here are the course pages:
    """
    
    # Add each course's markdown content to the prompt
    for url, markdown in valid_url_markdowns.items():
        # Truncate to avoid token limit issues
        truncated_markdown = markdown[:8000] if len(markdown) > 8000 else markdown
        prompt += f"\n\nCOURSE URL: {url}\n\n{truncated_markdown}\n"
    
    try:
        # Call Gemini API
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        
        # Extract valid JSON from response text
        response_text = response.text
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        
        course_details = {}
        
        if json_match:
            try:
                parsed_data = json.loads(json_match.group(0))
                print(f"Successfully extracted details for {len(parsed_data)} courses")
                course_details = parsed_data
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON from Gemini response: {e}")
        else:
            print("No valid JSON object found in Gemini response")
        
        # For any URLs that weren't in the response or failed to parse,
        # use fallback method
        for url in url_to_markdown.keys():
            if url not in course_details and url in url_to_markdown and url_to_markdown[url]:
                print(f"Using fallback method for course URL: {url}")
                course_details[url] = fallback_course_details_extraction(url_to_markdown[url])
        
        return course_details
    except Exception as e:
        print(f"Error in batch course details extraction: {e}")
        # Return empty dictionary
        return {}

async def scrape_class_central(search_keyword, num_courses=7):
    """
    Scrape course details from Class Central based on the provided search keyword using crawl4ai.
    This is a wrapper around batch_scrape_class_central for single topic compatibility.

    Args:
        search_keyword (str): The keyword to search for courses (e.g., "Python Programming").
        num_courses (int): Number of courses to scrape (default: 7).

    Returns:
        list: List of dictionaries containing course details.
    """
    # For backward compatibility, we'll use the batch processing function
    # but only pass a single topic
    try:
        results = await batch_scrape_class_central([search_keyword], num_courses)
        # Return the courses for the single topic
        if search_keyword in results and results[search_keyword]:
            return results[search_keyword]
        else:
            print(f"No courses found for {search_keyword}, returning fallback data")
            return get_fallback_courses(search_keyword, num_courses)
    except Exception as e:
        print(f"Error in scrape_class_central: {e}")
        return get_fallback_courses(search_keyword, num_courses)

async def extract_courses_from_markdown(markdown_content, num_courses, thumbnail_urls):
    """
    Extract course details from the markdown content using Gemini API.
    
    Args:
        markdown_content (str): Markdown content from Class Central search results.
        num_courses (int): Number of courses to extract.
        thumbnail_urls (list): List of thumbnail URLs extracted from markdown content.
        
    Returns:
        list: List of dictionaries containing course details.
    """
    # First check if we have a valid markdown content to work with
    if not markdown_content or len(markdown_content) < 100:
        print("Warning: Markdown content too short, likely invalid response")
        return []
    
    # Prompt for the Gemini API to extract course details
    prompt = f"""
    Extract detailed information for {num_courses} courses from the following Class Central search results. 
    For each course, extract:
    1. Course title (full name)
    2. Platform (provider like Coursera, edX, etc.)
    3. Course type (Course, Specialization, etc.)
    4. Duration (if available)
    5. Overview/description
    6. URL
    7. Any image URLs for thumbnails
    
    Markdown content:
    {markdown_content[:15000]}  # Limit content length to prevent token limit issues
    
    Return the data as a valid JSON array of course objects with these fields:
    - course_name
    - platform
    - course_type
    - duration
    - overview
    - url
    - thumbnail
    - thumbnail_alt (description of the thumbnail)
    
    Be precise about correctly extracting URLs. Make sure they are complete, not relative paths.
    """
    
    try:
        # Call Gemini API
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        
        # Extract valid JSON from response text
        response_text = response.text
        # Look for a JSON array
        json_match = re.search(r'\[\s*\{.*\}\s*\]', response_text, re.DOTALL)
        if json_match:
            # Process the matched JSON
            try:
                courses_data = json.loads(json_match.group(0))
                print(f"Successfully extracted {len(courses_data)} courses from markdown")
                
                # Validate and clean the extracted data
                valid_courses = []
                for i, course in enumerate(courses_data[:num_courses]):  # Limit to requested number
                    # Ensure all required fields exist
                    if 'course_name' not in course or not course['course_name']:
                        continue
                    
                    # Fix relative URLs
                    if 'url' in course and course['url']:
                        if not course['url'].startswith('http'):
                            if course['url'].startswith('/'):
                                course['url'] = f"https://www.classcentral.com{course['url']}"
                            else:
                                course['url'] = f"https://www.classcentral.com/{course['url']}"
                    
                    # Use extracted thumbnail URLs if available
                    if thumbnail_urls and i < len(thumbnail_urls):
                        course['thumbnail'] = thumbnail_urls[i]
                    else:
                        course_name_slug = course['course_name'].replace(' ', '+')
                        course['thumbnail'] = f"https://via.placeholder.com/300x200.png?text={course_name_slug}"
                    
                    # Ensure thumbnail_alt is set
                    if 'thumbnail_alt' not in course or not course['thumbnail_alt']:
                        course['thumbnail_alt'] = f"{course['course_name']} thumbnail"
                    
                    valid_courses.append(course)
                
                return valid_courses
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON: {e}")
        else:
            print("No valid JSON array found in response")
    except Exception as e:
        print(f"Error processing Gemini API response: {e}")
    
    # If we get here, use regex fallback method
    print("Using fallback regex method to extract courses")
    return extract_courses_with_regex(markdown_content, num_courses, thumbnail_urls)

def extract_courses_with_regex(markdown_content, num_courses, thumbnail_urls=None):
    """
    Extract comprehensive course information using regex patterns as a backup method.
    Optimized to extract as much information as possible from the main search pages.
    
    Args:
        markdown_content (str): Markdown content from Class Central search results.
        num_courses (int): Number of courses to extract.
        thumbnail_urls (list, optional): List of thumbnail URLs extracted from markdown content.
        
    Returns:
        list: List of dictionaries containing course details.
    """
    courses = []
    
    # Class Central's course listings are numbered (1., 2., etc.)
    # This pattern identifies individual course blocks from the numbered list
    course_blocks_pattern = r'(\d+\.)\s+\[\s*!\[.*?\]\([^\)]+\)\s*\]\([^\)]+\)[\s\S]*?(?=\d+\.\s+\[|$)'
    course_blocks = re.findall(course_blocks_pattern, markdown_content)
    
    # If we found fewer than expected blocks, try an alternative pattern
    if len(course_blocks) < min(5, num_courses):
        # Alternative pattern focusing on the course listing format
        alt_pattern = r'\d+\.\s+\[\s*!\[([^\]]+)\]\(([^\)]+)\)\s*\]\(([^\)]+)\)'
        course_matches = re.findall(alt_pattern, markdown_content)
        if course_matches:
            print(f"Found {len(course_matches)} courses using alternative pattern")
    
    if not course_blocks:
        # Fallback to simpler patterns if we couldn't identify course blocks
        # Pattern to match course titles in markdown output
        course_pattern = r'\[(.*?)\]\((.*?)\)'
        matches = re.findall(course_pattern, markdown_content)
        
        # Extract platform names separately
        platform_pattern = r'\*\s*\[\s*(.*?)\s*\]'
        platforms = re.findall(platform_pattern, markdown_content)
        
        # Try to extract course types - look for bullet points
        bullet_pattern = r'\*\s*([^\*\[\]]+)'
        bullet_points = re.findall(bullet_pattern, markdown_content)
        
        # Try to extract durations - look for time patterns
        duration_pattern = r'(\d+\s*(?:hours?|minutes?|days?|weeks?|months?))'
        durations = re.findall(duration_pattern, markdown_content, re.IGNORECASE)
        
        # Try to extract ratings
        rating_pattern = r'(\d+)\s*(?:rating|stars|reviews)'  
        ratings = re.findall(rating_pattern, markdown_content)
        
        # Try to extract review counts - including the Udemy pattern
        reviews_pattern = r'(\d+[,\d]*)\s*(?:reviews?|ratings?)(?:\s*at\s*[\w\s]+)?'
        reviews_counts = re.findall(reviews_pattern, markdown_content)
        
        # Try to extract course descriptions
        description_pattern = r'\[([^\[\]]{30,500})\]'
        descriptions = re.findall(description_pattern, markdown_content)

        # Extract free/paid indicators
        free_paid_pattern = r'(Free|Paid)\s*(?:Course|Video|Certificate)'
        free_paid = re.findall(free_paid_pattern, markdown_content, re.IGNORECASE)
    else:
        print(f"Found {len(course_blocks)} course blocks using pattern matching")

    # If thumbnail_urls wasn't passed, extract them now
    if thumbnail_urls is None:
        # Try to extract thumbnails from image markdown pattern
        thumbnail_pattern = r'!\[.*?\]\((https://[^\)]+)\)'
        thumbnail_matches = re.findall(thumbnail_pattern, markdown_content)
        
        # Also try the direct URL pattern as fallback
        direct_url_pattern = r'https://(?:[^\s)]+/course[_-]image/[^\s)]+\.(?:png|jpg|jpeg)|d3f1iyfxxz8i1e\.cloudfront\.net/courses/course_image/[^\s)]+\.(?:jpg|jpeg|png))'
        direct_matches = re.findall(direct_url_pattern, markdown_content)
        
        # Combine both patterns
        thumbnail_urls = thumbnail_matches + direct_matches
        print(f"Regex fallback found {len(thumbnail_urls)} thumbnails")
    
    # Process course blocks if we found them
    matches = []
    platforms = []
    descriptions = []
    free_paid = []
    durations = []
    ratings = []
    reviews_counts = []
    levels = []
    
    if course_blocks:
        # Process each course block to extract its components
        for block in course_blocks[:num_courses]:
            # Extract course name, thumbnail and URL from the course listing
            # Pattern: [ ![Title](thumbnail_url) ](course_url)
            title_thumb_url_match = re.search(r'\[\s*!\[([^\]]+)\]\(([^\)]+)\)\s*\]\(([^\)]+)\)', block)
            if title_thumb_url_match:
                course_name = title_thumb_url_match.group(1)
                thumbnail_url = title_thumb_url_match.group(2)
                url = title_thumb_url_match.group(3)
                matches.append((course_name, url, thumbnail_url))
            else:
                # Fallback to simpler pattern if the complex one fails
                title_url_match = re.search(r'##\s*\[([^\]]+)\]\s*\(([^\)]+)\)', block)
                if title_url_match:
                    course_name = title_url_match.group(1)
                    url = title_url_match.group(2)
                    thumbnail_url = "Not available"
                    matches.append((course_name, url, thumbnail_url))
                else:
                    continue  # Skip this block if we can't find title/URL
                
            # Extract platform - usually in a bullet point
            platform_match = re.search(r'\*\s*\[\s*(.*?)\s*\]', block)
            platforms.append(platform_match.group(1) if platform_match else "Class Central")
            
            # Extract description
            desc_match = re.search(r'\[([^\[\]]{30,})\]\(https://www\.classcentral\.com/.*?\)', block)
            descriptions.append(desc_match.group(1) if desc_match else f"A course about {course_name}")
            
            # Extract free/paid status
            free_paid_match = re.search(r'(Free|Paid)\s*(?:Course|Video|Certificate)', block, re.IGNORECASE)
            free_paid.append(free_paid_match.group(0) if free_paid_match else "Course")
            
            # Extract duration
            duration_match = re.search(r'(\d+\s*(?:hours?|minutes?|days?|weeks?|months?)(?:\s+\d+\s*(?:hours?|minutes?|days?|weeks?|months?))*)', block, re.IGNORECASE)
            durations.append(duration_match.group(1) if duration_match else "Not available")
            
            # Extract ratings and reviews
            rating_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:rating|stars)', block)
            ratings.append(rating_match.group(1) if rating_match else "3.5")
            
            review_match = re.search(r'(\d+[,\d]*)\s*(?:reviews?|ratings?)(?:\s*at\s*[\w\s]+)?', block)
            reviews_counts.append(review_match.group(1) if review_match else "10")
            
            # Extract level - if present
            level_match = re.search(r'(beginner|intermediate|advanced)', block, re.IGNORECASE)
            levels.append(level_match.group(1).capitalize() if level_match else "Not available")
    
    # Process either the course blocks we found or the simpler matches
    count = 0
    for i, data in enumerate(matches[:num_courses]):
        if count >= num_courses:
            break
            
        # Handle both tuple formats - older (name, url) and newer (name, url, thumbnail)
        if len(data) == 3:
            course_name, url, extracted_thumbnail = data
        else:
            course_name, url = data
            extracted_thumbnail = None
        
        # Only take courses with reasonable titles
        if len(course_name) < 5:  # Too short to be a real course name
            continue
        
        # Fix URL if needed
        if not url.startswith('http'):
            url = f"https://www.classcentral.com{url}" if url.startswith('/') else f"https://www.classcentral.com/{url}"
        
        # Try to associate with a platform
        platform = "Class Central"  # Default
        if i < len(platforms):
            platform = platforms[i]
        
        # Check specifically for YouTube content
        is_youtube = False
        if platform.lower() == "youtube":
            is_youtube = True
            print(f"Found YouTube content: {course_name}")
        elif "youtube" in url.lower() or "youtu.be" in url.lower():
            platform = "YouTube"
            is_youtube = True
            print(f"Detected YouTube content from URL: {course_name}")
        
        # Get thumbnail - prioritize the one extracted from the course block if available
        if extracted_thumbnail and extracted_thumbnail != "Not available" and extracted_thumbnail.startswith('http'):
            thumbnail = extracted_thumbnail
        elif thumbnail_urls and i < len(thumbnail_urls):
            thumbnail = thumbnail_urls[i]
        else:
            thumbnail = f"https://via.placeholder.com/300x200.png?text={course_name.replace(' ', '+')}"
        
        # Assign course type
        course_type = "Course"  # Default
        if is_youtube:
            course_type = "YouTube Video"
        elif i < len(free_paid):
            course_type = free_paid[i]
        elif "free" in markdown_content.lower():
            course_type = "Free Course"
        elif "paid" in markdown_content.lower():
            course_type = "Paid Course"
        
        # Get duration if available
        duration = "Not available"
        if i < len(durations):
            duration = durations[i]
        
        # Get description/overview
        overview = f"A course about {course_name} offered by {platform}."
        if i < len(descriptions):
            overview = descriptions[i]
        
        # Get rating if available
        rating_value = "3.5"  # Default rating
        if i < len(ratings):
            rating_value = ratings[i]
        
        # Get reviews count if available
        reviews_count = "10"  # Default
        if i < len(reviews_counts):
            reviews_count = reviews_counts[i]
        
        # Get level if available
        level = "Not available"
        if i < len(levels):
            level = levels[i]
        
        # Create comprehensive course object
        course = {
            "course_name": course_name,
            "platform": platform,
            "course_type": course_type,
            "duration": duration,
            "overview": overview,
            "url": url,
            "thumbnail": thumbnail,
            "thumbnail_alt": f"{course_name} thumbnail",
            "rating": f"{platform} Rating: {rating_value} ({reviews_count} ratings)",
            "rating_value": rating_value,
            "reviews_count": reviews_count,
            "level": level,
            "instructors": [],
            "subject": "Not available",
            "start_date": "Not available"
        }
        courses.append(course)
        count += 1
    
    return courses

if __name__ == "__main__":
    async def main():
        keyword = input("Enter search keyword for courses: ")
        courses = await scrape_class_central(keyword)
        print(json.dumps(courses, indent=2))
    
    asyncio.run(main())