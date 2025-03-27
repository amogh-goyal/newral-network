from google import generativeai as genai
from dotenv import load_dotenv
import os
import json

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

def get_topics_for_degree(degree, num_topics=6, country=None, preferred_language=None):
    """
    Generate a list of topics for a given degree or role using an LLM, appending the preferred language to programming-related topics when applicable, and indicate if the degree/role is programming-related.

    Args:
        degree (str): The degree or role to generate topics for (e.g., "Computer Science", "UI/UX Designer").
        num_topics (int): Number of topics to generate (default: 6).
        country (str): The user's country for region-specific topics (optional).
        preferred_language (str): User's preferred programming language (optional).

    Returns:
        tuple: (list of topic strings, bool indicating if degree/role is programming-related)
    """
    # Include preferred_language in the prompt only if provided
    language_info = f"with a preferred programming language of '{preferred_language}'" if preferred_language else "without a preferred programming language"

    prompt = f"""
Given the degree or role '{degree}' {language_info}, generate a list of {num_topics} key topics that are essential for someone pursuing this field. These topics should represent foundational areas of study or skills necessary for success in this degree or role. Ensure the topics are concise, specific, and suitable for finding relevant online courses.

{f"Consider the context of {country} for any region-specific relevance (e.g., local industries, languages, or certifications) if applicable." if country else "No specific country context is provided."}

Additional instructions:
- Order the topics in a logical sequence that reflects a natural learning progression, starting with foundational concepts and progressing to more advanced or specialized topics (e.g., for a Software Developer role, start with 'Programming Fundamentals', then 'Data Structures and Algorithms', before moving to 'Databases' or 'Software Design').
- Determine if the degree or role suggests a Computer Science, IT, or programming-related field (e.g., 'Computer Science', 'Software Developer', 'IT Specialist', 'Data Science', but not 'UI/UX Designer', 'Mechanical Engineering').
- If it is programming-related:
  - For topics that are programming-specific (e.g., 'Data Structures', 'Algorithms', but not 'Operating Systems', 'Computer Networks'), append the user's preferred programming language '{preferred_language}' if provided (e.g., 'Data Structures in Python').
  - If no preferred language is given, append a dominant programming language (e.g., 'Python', 'Java', 'C++') based on common usage in the field, unless the topic inherently involves multiple languages (e.g., 'Databases' might use SQL and Python, so leave it as 'Databases').
- If the degree/role isn’t programming-related, use the topic names alone without appending any language.

Return the response as a JSON object with two keys:
- 'topics': a list of exactly {num_topics} topic strings
- 'is_programming_related': a boolean indicating if the degree/role is programming-related

Provide no additional text or explanations beyond the JSON object.

Example response for 'Computer Science' with preferred_language='Python':
{{"topics": ["Data Structures in Python", "Algorithms in Python", "Operating Systems", "Databases", "Computer Networks", "Software Engineering in Python"], "is_programming_related": true}}

Example response for 'UI/UX Designer':
{{"topics": ["User Research", "Wireframing", "Prototyping", "Usability Testing", "Visual Design", "Interaction Design"], "is_programming_related": false}}
"""

    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        chat = model.start_chat(history=[])
        response = chat.send_message(prompt)
        response_text = response.text
        response_text = clean_response_text(response_text)
        response_json = json.loads(response_text)
        topics = response_json['topics']
        is_programming_related = response_json.get('is_programming_related', False)

        # Ensure the correct number of topics
        if len(topics) != num_topics:
            print(f"Warning: Expected {num_topics} topics, but got {len(topics)}. Adjusting...")
            topics = topics[:num_topics] if len(topics) > num_topics else topics + [f"Generic Topic {i + 1}" for i in range(num_topics - len(topics))]
        return topics, is_programming_related
    except Exception as e:
        print(f"Error parsing LLM response: {e}, response_text: {response_text if 'response_text' in locals() else 'Not available'}")
        # Fallback: return generic topics and assume not programming-related
        return [f"Topic {i + 1}" for i in range(num_topics)], False