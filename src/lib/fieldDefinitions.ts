// Plain-language definitions for Web Analytics sub-categories a business
// hasn't completed yet -- shown as a "View definition" toggle on the
// Agent Dashboard's category detail (see CategoryDetail.tsx), never for
// fields that are already complete (nothing to explain at that point),
// and never on Profile Completion even though some keys are shared (this
// copy is written specifically about the website).
//
// Keyed by sub_category_name. A field with no entry here just doesn't
// get the toggle -- this is deliberately not exhaustive.

export const FIELD_DEFINITIONS: Record<string, string> = {

  name: `If your name is missing from your website make sure you update to include your full name as it appears on your business listings and professional profiles.`,

  address: `If your workplace address is not listed on your website, please include it and make sure it remains consistent across all sections of your website as well as in online directories.`,

  phone_number: `If your Phone number is missing from your website make sure to add it to allow potential customers to contact you easily.`,

  load_time_less_or_equals_2o5: `Why is Load Time Important?
People expect websites to load quickly. Studies show that a one-second delay in page load time can result in a 7% conversion rate loss.
Search engines consider page load time as a ranking factor. Faster loading websites tend to rank higher in Search Engine Results Pages (SERPs).

How to Improve Website Load Times?
There are several ways to improve your website's load times:
Optimize Images: Resize images to appropriate dimensions and use the correct file format (e.g., JPEG for photos, PNG for graphics). Many online tools and plugins can help you compress images without sacrificing quality.
Reduce HTTP Requests: Combine multiple CSS and JavaScript files into single files. This reduces the number of requests the browser needs to make.
Enable Caching: Enable caching on your web server to store frequently accessed files locally on visitors' browsers.`,

  business_hours: `Add your business hours to inform potential customers about your availability and also enhance local search visibility.`,

  licenses_offered: `Include your license information to build credibility.`,

  service_areas: `Add Product and Service to help search engines understand your business and attract relevant customers.`,

  products_and_services_offered: `Include your license information to build credibility.`,

  email_address: `Display email address to allow potential customers to contact you directly.`,

  description: `The About Me section offers an organic opportunity to improve your website ranking in search results.
A well-written "About Me" section with relevant keywords, your experience, qualifications, and passion for your work can help establish trust and credibility with potential clients or customers. Also, Search engines like Google consider Expertise, Authoritativeness, and Trustworthiness (EAT) when ranking websites, and a strong "About Me" section can contribute to these factors.`,

  profile_photo: `Add a display picture with proper alt text for improved image indexing and accessibility.
1. Alt text describes an image on a web page. It helps search engines index and rank an image properly in image search.
2. Alt text is typically added via the alt attribute in an image's HTML code.
3. Code: <img src="image-file-example.jpg" alt="Alt text goes here">
Tip: Adding relevant keywords such as your "name-title-location" in alt text can help your images rank high in Google image results.`,

  disclaimer: `Essential for legal purposes and protects you from liability.`,

  title: `Title clearly communicates your professional background and expertise to visitors.`,

  awards: `Add your awards to improve credibility and trustworthiness in search results. Showcases your skills, accomplishments, and potential value to visitors.
1. If using an image:
   a. Ensure it includes proper alt text for better accessibility and search indexing.
   b. Alt text describes an image on a web page, helping search engines properly index and rank it in image search results.
   c. Alt text can be added via the alt attribute in an image's HTML code.
   d. Example code: <img src="award-image.jpg" alt="Award title and year">
2. If displaying the award as text, clearly mention the award name, organization, and year for clarity and impact.
Tip: Adding relevant keywords, such as 'award-title-year,' in the alt text or within the text description helps improve indexing and accessibility.`,

  hobbies: `Hobbies can show a well-rounded personality and potentially connect with visitors who share your interests.`,

  works_at: `Shows your current professional background and builds trust by demonstrating you're actively employed in your field.`,

  logo_photo: `Can help visitors instantly recognize your logo if they're familiar with the company.`,

  membership: `Membership in industry associations showcases your involvement in the broader professional community.
1. If using an image:
   a. Ensure it includes proper alt text for better accessibility and search indexing.
   b. Alt text describes an image on a web page, helping search engines properly index and rank it in image search results.
   c. Alt text can be added via the alt attribute in an image's HTML code.
   d. Example code: <img src="membership-image.jpg" alt="Membership title and year">
2. If displaying membership as text, clearly mention the organization, title, and year for clarity and impact.
Tip: Adding relevant keywords, such as 'membership-title-year,' in the alt text or within the text description helps improve indexing and accessibility.`,

  achievements: `Add your achievements to improve credibility and trustworthiness in search results. Showcases your skills, accomplishments, and potential value to visitors.`,

  year_started: `Add your year started to show your experience and establishment in your field.`,

  meta_description_tag: `Meta description tag appears below the title on the search engine results page. The code looks like <meta name="description" content="This is your meta description">

Here are some tips to help you craft effective meta descriptions:
1. Keep the description under 120 characters.
2. Avoid keyword stuffing. Include only your target keywords.
3. Match search intent or user intent (what the user is trying to achieve with their search).
4. Avoid duplicate meta descriptions on your website.`,

  robots_meta_tag: `Robots meta tag controls the crawling and indexing behavior of search engines.
1. Robots tag tells search engines whether you want it to analyze and display your page in search results.
2. To view this tag, go to your website, right-click, and select view page source. Now find "robots".
3. The tag looks like this: <meta name="robots" content="index, follow"> (This is the default setting and tells search engines to index the page and follow all links on the page.)`,

  language_meta_tag: `The language meta tag is used to specify the primary language of your website. Example: <html lang="en">`,

  meta_charset_tag: `Charset tag is used to specify the character encoding for your website.
1. You can add a charset meta tag in the head section of your HTML document, example: <meta charset="UTF-8">
2. In this example, UTF-8 is the character encoding being used. UTF-8 is a widely-used encoding that supports most of the characters in the Unicode standard and is a good choice for most web pages.`,

  title_tag: `A title meta tag tells search engines what the title of your website is.
Title is typically displayed above the description on search results pages as the clickable headline of a result.
This is how a title tag looks in HTML: <title>Experience.com: Find and Refer the Best Professionals</title>`,

  facebook_link: `Add and display your Facebook link to help visitors navigate to your Facebook page.`,

  google_business_profile_link: `Add your GBP profile to increase your chances of showing up in Google Maps and local search results.`,

  twitter_cards_meta_tag: `Twitter meta tags let you control how your content appears when shared on Twitter, making it more visually appealing and informative to grab attention and drive clicks to your website.`,
};

const REVIEW_SOURCE_DEFINITION = `1. Through Indexing – 50 Search Rank Score Points (Recommended)
Indexing reviews directly on your site allows search engines to fully access and index important review details, maximizing your Search Rank Score and enhancing your SEO. Ensure your on-page reviews include:
• Review Text: Keeps visitors engaged longer, which is a positive SEO signal.
• Rating: Shows transparency and commitment to customer satisfaction.
• Review Date: Helps visitors assess the relevance of a review; recent reviews carry more weight.
• Location: Provides context for the reviewer's experience, especially valuable for local clients.

Make sure your reviews are visible within your website's HTML code, not just displayed through images or scripts. This allows search engines to crawl and index the review content. You can check this by temporarily disabling JavaScript in your browser to see if the review content remains visible.

2. Through Review Widget – 20 Search Rank Score Points
Using the review widget is a quick way to display reviews on your site. However, it may not fully expose all review details (text, rating, date, location) to search engines, limiting its impact on your SEO and reducing your Search Rank Score.`;

for (const key of [
  "through_widget",
  "review_index_rating_on_each",
  "review_index_text",
  "review_index_location",
  "review_index_date",
]) {
  FIELD_DEFINITIONS[key] = REVIEW_SOURCE_DEFINITION;
}

export function getFieldDefinition(subCategoryKey: string): string | null {
  return FIELD_DEFINITIONS[subCategoryKey] || null;
}
