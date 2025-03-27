from google import generativeai as genai
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file")
genai.configure(api_key=API_KEY)

def clean_response_text(response_text):
    response_text = response_text.strip()
    if response_text.startswith("```json"):
        response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
    elif response_text.startswith("```"):
        response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
    return response_text.strip()

def parse_rating(rating_str):
    if rating_str == "Not available":
        return 0, 0
    match = re.search(r"(\d+\.\d+)\s*\((\d+,?\d*)\s*ratings\)", rating_str)
    if not match:
        match = re.search(r"(\d+\.\d+).*?(\d+,?\d*)", rating_str)
    if match:
        rating_value = float(match.group(1))  # Keep as float for accuracy
        reviews_count = int(match.group(2).replace(',', ''))
        return rating_value, reviews_count
    return 0, 0

def select_top_four_resources(topic, resources, include_paid=True):
    if not include_paid:
        resources = [r for r in resources if r.get('course_type', '').lower() in ["free course", "free", "self-paced"]]

    # Process resources to add rating_value and reviews_count
    for resource in resources:
        if resource['platform'] == "YouTube":
            resource['rating_value'] = 0
            resource['reviews_count'] = 0
        else:
            rating_value, reviews_count = parse_rating(resource.get('rating', 'Not available'))
            resource['rating_value'] = rating_value
            resource['reviews_count'] = reviews_count

    prompt = f"""
Select the top 4 most apt and relevant resources for the topic '{topic}' from the list below. The list includes Class Central courses and YouTube videos/playlists. Consider relevance, quality, and popularity. For YouTube content, prefer playlists and longer videos if they have similar relevance.

For Class Central courses:
- Course name relevance
- Platform reputation
- Overview (if available)
- Rating and number of reviews (courses with higher number of reviews are preferred)

For YouTube content:
- Title relevance
- Description
- View count (since ratings are not available)
- Duration (longer videos are preferred if relevance is similar)

Return ONLY a valid JSON object with:
- 'selected_resources': list of resource numbers (1-N)
- 'explanation': cumulative explanation using "These resources"

Example:
{{"selected_resources": [1, 2, 3, 4], "explanation": "These resources offer comprehensive coverage with high quality."}}

Resources:
"""
    for i, r in enumerate(resources, 1):
        prompt += f"{i}. {r['course_name']} ({r['platform']})\n"
        if 'overview' in r and r['overview'] != "Not available":
            prompt += f"   Overview: {r['overview'][:100]}...\n"
        elif 'description' in r and r['platform'] == "YouTube":
            prompt += f"   Description: {r['description'][:100]}...\n"
        if r['platform'] == "YouTube":
            prompt += f"   Views: {r.get('views', '0')}\n"
        else:
            if 'rating' in r and r['rating'] != "Not available":
                prompt += f"   Rating: {r['rating']}\n"
        if 'course_type' in r:
            prompt += f"   Type: {r['course_type']}\n"
        if 'duration' in r:
            prompt += f"   Duration: {r['duration']}\n"

    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        chat = model.start_chat(history=[])
        response = chat.send_message(prompt)
        response_text = response.text
        response_text = clean_response_text(response_text)
        response_json = json.loads(response_text)
        selected_numbers = [int(num) for num in response_json['selected_resources']]
        explanation = response_json['explanation']
        selected_resources = [resources[num - 1] for num in selected_numbers if 1 <= num <= len(resources)]
        return selected_resources, explanation
    except Exception as e:
        print(f"Error in select_top_four_resources: {e}, response: {response_text if 'response_text' in locals() else 'Not available'}")
        return resources[:4], "Failed to select resources; defaulting to first four available."