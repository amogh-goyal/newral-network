import asyncio
from web_scraper import scrape_class_central
from topic_generator import get_topics_for_degree
from course_selector import select_top_four_resources
from youtube_api import search_youtube
import pycountry


async def generate_roadmap(degree, country=None, language='en', include_paid=True, preferred_language=None):
    # Step 1: Determine if the degree/role is programming-related without passing preferred_language
    topics, is_programming_related = get_topics_for_degree(
        degree, num_topics=6, country=country, preferred_language=None
    )

    # Step 2: If programming-related and preferred_language is provided, regenerate topics with the language
    if is_programming_related and preferred_language:
        topics, _ = get_topics_for_degree(
            degree, num_topics=6, country=country, preferred_language=preferred_language
        )

    region_code = get_region_code(country)
    selected_resources_per_topic = {}
    explanations = {}

    # Process each topic sequentially
    for topic in topics:
        # Run scraping and YouTube API in parallel for this topic
        scraping_task = asyncio.create_task(scrape_class_central(topic))
        youtube_task = asyncio.to_thread(search_youtube, topic, language, region_code)
        class_central_courses, youtube_courses = await asyncio.gather(scraping_task, youtube_task)

        # Combine resources and select top 4
        all_resources = class_central_courses + youtube_courses
        selected_resources, explanation = select_top_four_resources(topic, all_resources, include_paid)
        selected_resources_per_topic[topic] = selected_resources
        explanations[topic] = explanation

    # Generate options
    options = []
    for i in range(1, 5):
        option_topics = []
        for step, topic in enumerate(topics, 1):
            resources = selected_resources_per_topic.get(topic, [])
            if resources:
                resource_index = min(i - 1, len(resources) - 1)
                resource = resources[resource_index]
                step_data = {
                    "step_number": step,
                    "topic": topic,
                    "thumbnail": resource.get("thumbnail_url", "Not found"),
                    "url": resource["url"],
                    "rating": int(resource["rating_value"]),
                    "reviews_count": resource["reviews_count"],
                    "completed": False
                }
            else:
                step_data = {
                    "step_number": step,
                    "topic": topic,
                    "thumbnail": "Not available",
                    "url": "",
                    "rating": 0,
                    "reviews_count": 0,
                    "completed": False
                }
            option_topics.append(step_data)
        options.append({
            "option_id": str(i),
            "option_name": f"Option {i}",
            "topics": option_topics
        })

    title = f"Your Path to {degree} Mastery"
    description = " ".join([f"For {topic}: {explanations.get(topic, 'No explanation available')}." for topic in topics])
    roadmap = {
        "title": title,
        "description": description,
        "topic": degree,
        "selected_option":"1",
        "options": options
    }
    return roadmap


def get_region_code(country):
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
        import json
        print(json.dumps(roadmap, indent=2))


    asyncio.run(main())