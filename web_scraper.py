from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import re
import asyncio
import random

async def scrape_class_central(search_keyword, num_courses=7):
    """
    Scrape course details from Class Central based on the provided search keyword using Playwright.

    Args:
        search_keyword (str): The keyword to search for courses (e.g., "Python Programming").
        num_courses (int): Number of courses to scrape (default: 7).

    Returns:
        list: List of dictionaries containing course details.
    """
    courses_list = []

    # Helper functions
    async def random_sleep(min_time=1, max_time=3):
        await asyncio.sleep(random.uniform(min_time, max_time))

    async def goto_with_retry(page, url, retries=3, timeout=120000):
        """Navigate to a URL with retries and increased timeout."""
        for attempt in range(1, retries + 1):
            try:
                await page.goto(url, timeout=timeout, wait_until="load")
                return
            except Exception as e:
                if attempt < retries:
                    print(f"Attempt {attempt} failed for {url}: {e}. Retrying...")
                    await asyncio.sleep(5)  # Wait before retrying
                else:
                    raise Exception(f"Failed to load {url} after {retries} attempts: {e}")

    def extract_text_from_html(html_content):
        soup = BeautifulSoup(html_content, 'html.parser')
        return soup.get_text(strip=True)

    async def extract_course_title(page):
        try:
            # First try to get the title with a more specific selector
            title_elem = page.locator("h1.head-2")
            if await title_elem.count() > 0 and await title_elem.is_visible():
                return (await title_elem.text_content()).strip()

            # If that doesn't work, try the second most common pattern
            title_elem = page.locator("h1.text-1.weight-bold")
            if await title_elem.count() > 0 and await title_elem.is_visible():
                return (await title_elem.text_content()).strip()

            # Try the head-2 with max-650 class
            title_elem = page.locator("h1.head-2.max-650")
            if await title_elem.count() > 0 and await title_elem.is_visible():
                return (await title_elem.text_content()).strip()

            # If all else fails, get all h1 elements and choose the first visible one
            title_elems = await page.locator("h1").all()
            for elem in title_elems:
                if await elem.is_visible():
                    return (await elem.text_content()).strip()

            return "Unknown Title"
        except Exception as e:
            print(f"Error extracting title: {e}")
            return "Unknown Title"

    async def extract_thumbnail_from_search_result(course):
        try:
            thumbnail_img = course.locator("img.absolute.top.left.width-100.height-100.cover.block")
            return {
                "url": await thumbnail_img.get_attribute("src") or "Not found",
                "alt": await thumbnail_img.get_attribute("alt") or "Not available"
            }
        except:
            return {"url": "Not found", "alt": "Not available"}

    async def extract_platform_from_search_result(course):
        try:
            platform_anchor = course.locator("a.hover-underline.color-charcoal.text-3.margin-left-small.line-tight")
            return (await platform_anchor.text_content()).strip()
        except:
            try:
                # Try to find platform by image (provider logo)
                platform_img = course.locator("img.vertical-align-middle.margin-right-xsmall")
                return await platform_img.get_attribute("alt") or "Unknown"
            except:
                try:
                    # Look for text in spans that might contain platform name
                    platform_spans = await course.locator("span.text-2.line-tight, span.text-1.block.scale-down-1").all()
                    for span in platform_spans:
                        text = (await span.text_content()).strip()
                        if text and not text.isdigit():  # Avoid returning just numbers
                            return text
                    return "Unknown"
                except:
                    return "Unknown"

    async def extract_platform_rating(page):
        try:
            # Using XPath selector which works better for finding rating elements
            rating_elements = await page.locator(
                "//p[contains(@class, 'text-') and contains(@class, 'medium-down-margin')]").all()
            for element in rating_elements:
                text = (await element.text_content()).strip()
                if "rating at " in text:
                    rating_match = re.search(r"(\d+\.\d+)\s+rating at ([A-Za-z]+) based on (\d+,?\d*) ratings", text)
                    if rating_match:
                        rating = rating_match.group(1)
                        platform = rating_match.group(2)
                        num_ratings = rating_match.group(3)
                        return f"{platform} Rating: {rating} ({num_ratings} ratings)"
                    return text
            return "Not available"
        except:
            return "Not available"

    async def extract_course_overview(page):
        try:
            # Wait for the overview section to load
            await page.wait_for_load_state("networkidle")

            # Try multiple potential selectors for overview
            selectors = [
                "div.wysiwyg.text-1.line-wide",
                "div.wysiwyg.text-1-line-wide",
                "div.wysiwyg",
                "div.course-description"
            ]

            for selector in selectors:
                try:
                    overview_elem = page.locator(selector)
                    if await overview_elem.count() > 0:
                        # Use first() to get only the first matching element
                        overview_text = (await overview_elem.first.text_content()).strip()
                        if overview_text:
                            return overview_text
                except Exception as inner_e:
                    print(f"Error with selector {selector}: {inner_e}")
                    continue

            # If we couldn't find a matching selector, look for text under the Overview heading
            try:
                overview_heading = page.locator("h2:text('Overview'), h3:text('Overview')").first
                if await overview_heading.count() > 0:
                    # Get the next sibling elements that might contain the overview
                    next_elem = overview_heading.locator("xpath=./following-sibling::*[1]")
                    if await next_elem.count() > 0:
                        return (await next_elem.text_content()).strip()
            except Exception as heading_e:
                print(f"Error finding Overview heading: {heading_e}")

            return "Not available"
        except Exception as e:
            print(f"Error extracting overview: {e}")
            return "Not available"

    async def extract_course_details(page):
        details = {}

        # Extract course type (free or paid)
        try:
            # Check multiple indicators of course type
            course_detail_items = await page.locator("li.course-details-item").all()
            for item in course_detail_items:
                item_text = (await item.text_content()).strip().lower()
                if "free" in item_text:
                    details["course_type"] = "Free Course"
                    break
                elif any(term in item_text for term in ["paid", "certificate", "nanodegree"]):
                    details["course_type"] = "Paid Course"
                    break

            # Check for dollar sign icon or elements with cost information
            if "course_type" not in details:
                dollar_icon_items = await page.locator("li:has(span.icon-cost-dollar), span.icon-cost-dollar").all()
                if dollar_icon_items:
                    for item in dollar_icon_items:
                        item_text = (await item.text_content()).strip().lower()
                        if "free" in item_text:
                            details["course_type"] = "Free Course"
                            break
                        else:
                            details["course_type"] = "Paid Course"
                            break

            # Look for text indicating "Free Online Course"
            if "course_type" not in details:
                try:
                    # Fix the problematic selector by using separate locators
                    free_text_spans = await page.locator("span.text-2.line-tight").filter(has_text="Free").all()
                    free_text_elements = await page.locator("text=Free Online Course").all()
                    
                    if free_text_spans or free_text_elements:
                        details["course_type"] = "Free Course Online"
                except Exception as e:
                    print(f"Error extracting course type: {e}")

            # Check for "Paid Certificate Available" text
            if "course_type" not in details:
                paid_text_spans = await page.locator("span.text-2.line-tight").filter(has_text="Paid").all()
                paid_indicators = await page.locator("text=Paid Certificate").all()
                if paid_indicators or paid_text_spans:
                    details["course_type"] = "Paid Certificate Option"

            # Default if all else fails
            if "course_type" not in details:
                details["course_type"] = "Not available"

        except Exception as e:
            print(f"Error extracting course type: {e}")
            details["course_type"] = "Not available"

        try:
            # Extract and clean duration
            duration_elems = await page.locator("li.course-details-item").all()
            for elem in duration_elems:
                text = (await elem.text_content()).strip()
                if any(unit in text.lower() for unit in ["day", "hour", "minute", "week", "month"]):
                    # Clean unwanted text like "Duration & workload"
                    clean_text = re.sub(r"Duration & workload\s*", "", text, flags=re.IGNORECASE).strip()
                    clean_text = re.sub(r"\s+", " ", clean_text)
                    details["duration"] = clean_text
                    break
            else:
                details["duration"] = "Not available"
        except Exception as e:
            print(f"Error extracting duration: {e}")
            details["duration"] = "Not available"

        return details

    async with async_playwright() as p:
        # Launch browser with a user agent
        browser = await p.chromium.launch(headless=True,chromium_sandbox=False)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            extra_http_headers={"Accept-Language": "en-US,en;q=0.9"},
            ignore_https_errors=True
        )
        page = await context.new_page()

        # Navigate to Class Central
        base_url = "https://www.classcentral.com"
        try:
            await goto_with_retry(page, base_url)
            await random_sleep(2, 4)
        except Exception as e:
            print(f"Failed to load Class Central: {e}")
            await browser.close()
            return courses_list

        # Perform search
        try:
            search_input = page.get_by_placeholder("Search 250,000 courses…")
            await search_input.click()
            await random_sleep(1, 2)
            await search_input.fill(search_keyword)
            await random_sleep(1, 2)
            await search_input.press("Enter")
            await random_sleep(2, 4)
        except Exception as e:
            print(f"Error during search: {e}")
            await browser.close()
            return courses_list

        # Wait for course list and scrape
        try:
            await page.wait_for_selector(".course-list", timeout=14000)
            course_elements = await page.locator(".course-list-course").all()
            course_elements = course_elements[:num_courses]

            for course in course_elements:
                course_details = {}
                thumbnail_info = await extract_thumbnail_from_search_result(course)
                platform_name = await extract_platform_from_search_result(course)
                link_elem = course.locator("a.course-name")
                href = await link_elem.get_attribute("href") or ""

                if not href.startswith("http"):
                    href = f"{base_url}{href}"

                # Open course page with retry
                course_page = await context.new_page()
                try:
                    await goto_with_retry(course_page, href)
                    await random_sleep(2, 3)

                    # Extract course title using the new function
                    course_title = await extract_course_title(course_page)

                    if platform_name == "YouTube":
                        course_details = {
                            "course_name": course_title,
                            "platform": "YouTube",
                            "rating": "Not available",
                            "course_type": "Free",
                            "duration": "Not available",
                            "overview": "Not available",
                            "url": href,
                            "thumbnail_url": thumbnail_info["url"],
                            "thumbnail_alt": thumbnail_info["alt"]
                        }
                    else:
                        platform_rating = await extract_platform_rating(course_page)
                        course_overview = await extract_course_overview(course_page)
                        details = await extract_course_details(course_page)
                        course_details = {
                            "course_name": course_title,
                            "platform": platform_name,
                            "rating": platform_rating,
                            "course_type": details.get("course_type", "Not available"),
                            "duration": details.get("duration", "Not available"),
                            "overview": course_overview,
                            "url": href,
                            "thumbnail_url": thumbnail_info["url"],
                            "thumbnail_alt": thumbnail_info["alt"]
                        }
                    courses_list.append(course_details)
                except Exception as e:
                    print(f"Error scraping course page {href}: {e}")
                    course_details = {
                        "course_name": "Error",
                        "platform": platform_name,
                        "rating": "Not available",
                        "course_type": "Not available",
                        "overview": "Not available",
                        "url": href,
                        "thumbnail_url": thumbnail_info["url"],
                        "thumbnail_alt": thumbnail_info["alt"]
                    }
                    courses_list.append(course_details)
                finally:
                    await course_page.close()
                    await random_sleep(1, 2)

        except Exception as e:
            print(f"Error scraping courses for {search_keyword}: {e}")
        finally:
            await browser.close()

    return courses_list

if __name__ == "__main__":
    async def main():
        keyword = "XML for UI Development"
        result = await scrape_class_central(keyword)
        for course in result:
            print(course)
    asyncio.run(main())