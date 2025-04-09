import asyncio
import os
import re
import json
from dotenv import load_dotenv
from crawl4ai import AsyncWebCrawler
import google.generativeai as genai

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = 'gemini-1.5-flash'

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)

async def scrape_class_central(search_keyword, num_courses=7):
    """
    Scrape course details from Class Central based on the provided search keyword using crawl4ai.

    Args:
        search_keyword (str): The keyword to search for courses (e.g., "Python Programming").
        num_courses (int): Number of courses to scrape (default: 7).

    Returns:
        list: List of dictionaries containing course details.
    """
    # Replace spaces with %20 for URL encoding
    encoded_keyword = search_keyword.replace(" ", "%20")
    url = f"https://www.classcentral.com/search?q={encoded_keyword}"
    
    # Fallback data in case of errors
    fallback_courses = [
        {
            "course_name": f"{search_keyword} Course {i}",
            "platform": "Class Central",
            "course_type": "Not available",
            "duration": "Not available",
            "overview": "Course details temporarily unavailable",
            "url": "https://www.classcentral.com",
            "thumbnail": f"https://via.placeholder.com/300x200.png?text={search_keyword.replace(' ', '+')}+Course+{i}",
            "thumbnail_alt": f"{search_keyword} Course {i} thumbnail",
            "rating": "Not available",
            "rating_value": "3.5",  # Default rating for fallback
            "reviews_count": "10"    # Default reviews count for fallback
        } for i in range(1, num_courses + 1)
    ]
    
    try:
        # Create a crawler instance with explicit configuration
        print(f"Initializing crawler for: {search_keyword}")
        crawler = AsyncWebCrawler(
            verbose=True,
            headless=True,
            timeout=60
        )
        
        try:
            # Get search results page
            print(f"Fetching search results for: {search_keyword}")
            result = await crawler.arun(url=url)
            
            # Log response status to help with debugging
            print(f"Response received for {search_keyword}. Length: {len(result.markdown) if hasattr(result, 'markdown') else 'unknown'}")
            
            # Check if we got a valid response
            if not hasattr(result, 'markdown') or not result.markdown or len(result.markdown) < 100:
                print(f"Invalid or empty response received for {search_keyword}, using fallback data")
                return fallback_courses
                
            markdown_content = result.markdown

            # Extract thumbnail URLs directly from the markdown content
            thumbnail_urls = re.findall(r'https://[^\s)]+/course[_-]image/[^\s)]+\.(?:png|jpg|jpeg)', markdown_content)
            print(f"Found {len(thumbnail_urls)} thumbnails in the markdown content")
            
            # Extract basic course information from search results
            print("Extracting course information from search results")
            courses_list = await extract_courses_from_markdown(markdown_content, num_courses, thumbnail_urls)
            
            if not courses_list:
                print("No courses found in search results, using fallback data")
                return fallback_courses

            # Set default values for all courses instead of fetching individual details
            enhanced_courses = []
            for course in courses_list:
                # Ensure all required fields are present with default values
                if 'rating_value' not in course:
                    course['rating_value'] = '3.5'  # Default rating
                if 'reviews_count' not in course:
                    course['reviews_count'] = '10'  # Default reviews count
                if 'rating' not in course:
                    course['rating'] = 'Not available'
                if 'overview' not in course or not course['overview']:
                    course['overview'] = f"Course about {search_keyword}. Visit the course page for more details."
                    
                enhanced_courses.append(course)

            return enhanced_courses if enhanced_courses else fallback_courses
        except Exception as e:
            print(f"Error during scraping: {e}")
            return fallback_courses
        finally:
            # Ensure crawler is properly closed
            try:
                print("Closing crawler instance")
                # Check if browser is still connected before closing
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
                # Even if there's an error, we'll consider the crawler closed
                # This prevents cascading errors in subsequent API calls
    except Exception as e:
        print(f"Failed to initialize crawler: {e}")
        return fallback_courses

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
    Extract course information using regex patterns as a backup method.
    
    Args:
        markdown_content (str): Markdown content from Class Central search results.
        num_courses (int): Number of courses to extract.
        thumbnail_urls (list, optional): List of thumbnail URLs extracted from markdown content.
        
    Returns:
        list: List of dictionaries containing course details.
    """
    courses = []
    
    # Pattern to match course lines in markdown output
    course_pattern = r'\[(.*?)\]\((.*?)\)'
    matches = re.findall(course_pattern, markdown_content)
    
    # Extract platform names separately
    platform_pattern = r'\*\*(.*?)\*\*'
    platforms = re.findall(platform_pattern, markdown_content)
    
    # If thumbnail_urls wasn't passed, extract them now
    if thumbnail_urls is None:
        thumbnail_urls = re.findall(r'https://[^\s)]+/course[_-]image/[^\s)]+\.(?:png|jpg|jpeg)', markdown_content)
        print(f"Regex fallback found {len(thumbnail_urls)} thumbnails")
    
    # Process matches up to the requested number
    count = 0
    for i, match in enumerate(matches):
        if count >= num_courses:
            break
            
        # Only take matches that look like course titles (not navigation links)
        if len(match[0]) > 10:  # Simple heuristic to filter out short links
            course_name = match[0]
            url = match[1]
            
            # Try to associate with a platform
            platform = "Class Central"  # Default
            if i < len(platforms):
                platform = platforms[i]
            
            # Get thumbnail if available
            thumbnail = ""
            if thumbnail_urls and i < len(thumbnail_urls):
                thumbnail = thumbnail_urls[i]
            else:
                thumbnail = f"https://via.placeholder.com/300x200.png?text={course_name.replace(' ', '+')}"
            
            # Create course object
            course = {
                "course_name": course_name,
                "platform": platform,
                "course_type": "Course",  # Default
                "duration": "Not specified",  # Default
                "overview": f"A course about {course_name} offered by {platform}.",
                "url": url if url.startswith('http') else f"https://www.classcentral.com{url}",
                "thumbnail": thumbnail,
                "thumbnail_alt": f"{course_name} thumbnail"
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