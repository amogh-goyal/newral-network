from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv
import os
import re
from datetime import datetime, timedelta

# Load environment variables from .env file
load_dotenv()

# Get the YouTube API key from environment variables
API_KEY = os.getenv("YOUTUBE_API_KEY")
if not API_KEY:
    raise ValueError("YOUTUBE_API_KEY not found in .env file")

# Initialize YouTube API client
youtube = build('youtube', 'v3', developerKey=API_KEY)

# Language mapping for common full names to ISO 639-1 codes
LANGUAGE_MAP = {
    "english": "en",
    "spanish": "es",
    "french": "fr",
    "german": "de",
    "italian": "it",
    "portuguese": "pt",
    "russian": "ru",
    "chinese": "zh",
    "japanese": "ja",
    "korean": "ko",
    "arabic": "ar",
    "hindi": "hi",
    # Add more mappings as needed
}

def normalize_language_code(language):
    """Convert a language name or code to a two-letter ISO 639-1 code."""
    if not language:
        return "en"  # Default to English
    language = language.lower().strip()
    if len(language) == 2 and language.isalpha():  # Already a valid code
        return language
    mapped_language = LANGUAGE_MAP.get(language, "en")
    if mapped_language == "en" and language not in LANGUAGE_MAP:
        print(f"Warning: Unrecognized language '{language}', defaulting to 'en'")
    return mapped_language

def parse_duration(duration):
    """Parse ISO 8601 duration to seconds."""
    pattern = r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?'
    match = re.match(pattern, duration)
    if not match:
        return 0
    hours = int(match.group(1)) if match.group(1) else 0
    minutes = int(match.group(2)) if match.group(2) else 0
    seconds = int(match.group(3)) if match.group(3) else 0
    return hours * 3600 + minutes * 60 + seconds

def format_duration(seconds):
    """Convert seconds to a human-readable duration string."""
    if seconds < 60:
        return f"{seconds} seconds"
    elif seconds < 3600:
        minutes = seconds // 60
        return f"{minutes} minutes"
    else:
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        if minutes == 0:
            return f"{hours} hours"
        else:
            return f"{hours} hours {minutes} minutes"

def get_video_durations(video_ids):
    """Retrieve durations for a list of video IDs without caching."""
    if not video_ids:
        return {}

    try:
        request = youtube.videos().list(
            part='contentDetails',
            id=','.join(video_ids)
        )
        response = request.execute()
        durations = {item['id']: parse_duration(item['contentDetails']['duration'])
                     for item in response.get('items', [])}
        return durations
    except HttpError as e:
        if e.resp.status == 403 and 'quotaExceeded' in str(e):
            print(f"Quota exceeded fetching durations for {video_ids}.")
            return {}
        raise

def get_video_statistics(video_ids):
    """Retrieve statistics for a list of video IDs without caching."""
    if not video_ids:
        return {}

    try:
        request = youtube.videos().list(
            part='statistics',
            id=','.join(video_ids)
        )
        response = request.execute()
        stats = {item['id']: item['statistics'] for item in response.get('items', [])}
        return stats
    except HttpError as e:
        if e.resp.status == 403 and 'quotaExceeded' in str(e):
            print(f"Quota exceeded fetching statistics for {video_ids}.")
            return {}
        raise

def search_youtube(query, language='en', region_code=None, max_results=5):
    """
    Search YouTube for playlists and long videos (excluding Shorts) based on a query.
    This is a synchronous function that should NOT be awaited.

    Args:
        query (str): The search query.
        language (str): The preferred language (e.g., 'en' or 'english').
        region_code (str): The region code (e.g., 'US').
        max_results (int): Maximum number of results to return (default: 5).

    Returns:
        list: A list of dictionaries containing YouTube content details.
    """
    # Normalize language code
    normalized_language = normalize_language_code(language)

    try:
        # Search for both videos and playlists
        search_response = youtube.search().list(
            q=query,
            part='id,snippet',
            maxResults=max_results * 2,  # Fetch more results to account for filtering
            type='video,playlist',
            relevanceLanguage=normalized_language,  # Use normalized code
            regionCode=region_code
        ).execute()

        # Separate videos and playlists
        video_ids = []
        playlists = []
        videos = []

        for item in search_response.get('items', []):
            kind = item['id']['kind']
            title = item['snippet']['title']
            description = item['snippet']['description']
            thumbnail = item['snippet']['thumbnails']['default']['url']
            if kind == 'youtube#video':
                video_ids.append(item['id']['videoId'])
                videos.append({
                    "course_name": title,
                    "platform": "YouTube",
                    "description": description,
                    "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                    "thumbnail": thumbnail,
                    "thumbnail_alt": title,
                    "views": "0",  # Will be updated later
                    "rating": "Not available",
                    "course_type": "Free",
                    "duration": "Not available"  # Will be updated later
                })
            elif kind == 'youtube#playlist':
                playlists.append({
                    "course_name": title,
                    "platform": "YouTube",
                    "description": description,
                    "url": f"https://www.youtube.com/playlist?list={item['id']['playlistId']}",
                    "thumbnail": thumbnail,
                    "thumbnail_alt": title,
                    "views": "0",  # Playlists don't have view counts directly
                    "rating": "Not available",
                    "course_type": "Free",
                    "duration": "Playlist"
                })

        # Filter out Shorts and add duration to videos
        durations = get_video_durations(video_ids)
        long_videos = []
        for video, vid in zip(videos, video_ids):
            duration_seconds = durations.get(vid, 0)
            if duration_seconds > 60:  # Exclude videos under 60 seconds
                video['duration'] = format_duration(duration_seconds)
                long_videos.append(video)

        # Get view counts for long videos
        long_video_ids = [video['url'].split('v=')[1] for video in long_videos]
        if long_video_ids:
            stats = get_video_statistics(long_video_ids)
            for video, vid in zip(long_videos, long_video_ids):
                video['views'] = stats.get(vid, {}).get('viewCount', '0')

        # Combine results, prioritizing playlists
        results = playlists + long_videos
        results = results[:max_results]  # Trim to max_results

        print(f"Fetched new results for query: '{query}'")
        return results

    except HttpError as e:
        if e.resp.status == 403 and 'quotaExceeded' in str(e):
            print(f"YouTube API quota exceeded for query: '{query}'. Returning empty list.")
            return []
        print(f"Error searching YouTube: {e}")
        return []
    except Exception as e:
        print(f"Error searching YouTube: {e}")
        return []

# Nothing further needed - using the simplified implementation