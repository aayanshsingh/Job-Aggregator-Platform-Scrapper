/**
 * LinkedIn job extraction - enhanced for accuracy
 * @param {Object} jobData - The job data object to populate
 * @return {Object} - The populated job data object
 */
function extractLinkedInJobInfo(jobData) {
  try {
    // Extract job title (multiple selectors for different LinkedIn layouts)
    const titleSelectors = [
      '.job-details-jobs-unified-top-card__job-title',
      '.t-24.t-bold.inline h1',
      '.topcard__title',
      '.jobs-unified-top-card__job-title',
      'h1.t-24'
    ];
    
    for (const selector of titleSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        for (const element of elements) {
          const text = element.textContent?.trim();
          if (text) {
            jobData.title = text;
            break;
          }
        }
        if (jobData.title !== "Unknown Position") break;
      }
    }
    
    // Extract company name
    const companySelectors = [
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.topcard__org-name-link',
      '.jobs-unified-top-card__company-name',
      'a[data-tracking-control-name="public_jobs_topcard_company-name"]'
    ];
    
    for (const selector of companySelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        for (const element of elements) {
          const text = element.textContent?.trim();
          if (text) {
            jobData.company = text;
            break;
          }
        }
        if (jobData.company !== "Unknown Company") break;
      }
    }
    
    // Extract location
    const locationSelectors = [
      '.job-details-jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__primary-description-container .tvm__text:first-child',
      '.topcard__flavor--bullet',
      '.jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__workplace-type'
    ];
    
    for (const selector of locationSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        for (const element of elements) {
          const text = element.textContent?.trim();
          if (text && !text.includes('employees') && !text.includes('followers') && !text.includes('applicants')) {
            jobData.location = text;
            break;
          }
        }
        if (jobData.location !== "Unknown Location") break;
      }
    }
    
    // Extract job type (Remote, Hybrid, On-site, Full-time, Part-time, etc.)
    const jobTypeSelectors = [
      '.job-details-jobs-unified-top-card__workplace-type',
      '.jobs-unified-top-card__workplace-type',
      '.job-details-preferences-and-skills__pill',
      '.job-criteria__item [data-test-job-criteria-label="Working pattern"]'
    ];
    
    for (const selector of jobTypeSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        for (const element of elements) {
          const text = element.textContent?.trim();
          
          // Check for various job type patterns
          if (text) {
            if (/remote|work from home|wfh/i.test(text)) {
              jobData.jobType = jobData.jobType ? `${jobData.jobType}, Remote` : 'Remote';
            } else if (/hybrid/i.test(text)) {
              jobData.jobType = jobData.jobType ? `${jobData.jobType}, Hybrid` : 'Hybrid';
            } else if (/on-?site|in-?office/i.test(text)) {
              jobData.jobType = jobData.jobType ? `${jobData.jobType}, On-site` : 'On-site';
            } else if (/full-?time/i.test(text)) {
              jobData.jobType = jobData.jobType ? `${jobData.jobType}, Full-time` : 'Full-time';
            } else if (/part-?time/i.test(text)) {
              jobData.jobType = jobData.jobType ? `${jobData.jobType}, Part-time` : 'Part-time';
            } else if (/contract/i.test(text)) {
              jobData.jobType = jobData.jobType ? `${jobData.jobType}, Contract` : 'Contract';
            } else if (/intern|internship/i.test(text)) {
              jobData.jobType = jobData.jobType ? `${jobData.jobType}, Internship` : 'Internship';
            } else if (/temporary/i.test(text)) {
              jobData.jobType = jobData.jobType ? `${jobData.jobType}, Temporary` : 'Temporary';
            }
          }
        }
      }
    }
    
    // Extract experience level from criteria items and job description
    // First try from job criteria sections
    const jobInfoSections = document.querySelectorAll('.description__job-criteria-item, .job-criteria__item');
    for (const section of jobInfoSections) {
      if (!section) continue;
      
      const label = section.querySelector('.description__job-criteria-subheader, .job-criteria__subheader');
      const value = section.querySelector('.description__job-criteria-text, .job-criteria__text');
      
      if (label && value) {
        const labelText = label.textContent?.trim().toLowerCase() || "";
        const valueText = value.textContent?.trim() || "";
        
        if (labelText.includes('experience') || labelText.includes('seniority')) {
          jobData.experienceLevel = valueText;
          break;
        }
      }
    }
    
    // If experience level not found in criteria, try from job description
    if (!jobData.experienceLevel) {
      const jobDescElement = document.querySelector('.jobs-description__content, #job-details');
      if (jobDescElement) {
        const jobDescText = jobDescElement.textContent || '';
        
        // Look for experience patterns in the job description
        const experiencePatterns = [
          /\b(?:entry[- ]level|fresher|fresh graduate)\b/i,
          /\bno experience\b/i,
          /\b0[- ]?(?:year|yr)[s]? experience\b/i,
          /\b(?:1|one)[- ]?(?:year|yr)[s]? experience\b/i,
          /\b(?:2|two)[- ]?(?:year|yr)[s]? experience\b/i,
          /\b(?:3|three)[- ]?(?:year|yr)[s]? experience\b/i,
          /\b(?:4|four)[- ]?(?:year|yr)[s]? experience\b/i,
          /\b(?:5|five)[- ]?(?:year|yr)[s]? experience\b/i,
          /\b(?:1|one)[- ]?(?:to|–|-)[- ]?(?:2|two)[- ]?(?:year|yr)[s]? experience\b/i,
          /\b(?:2|two)[- ]?(?:to|–|-)[- ]?(?:3|three)[- ]?(?:year|yr)[s]? experience\b/i,
          /\b(?:3|three)[- ]?(?:to|–|-)[- ]?(?:5|five)[- ]?(?:year|yr)[s]? experience\b/i,
          /\b(?:5|five)[- ]?(?:to|–|-)[- ]?(?:8|eight)[- ]?(?:year|yr)[s]? experience\b/i,
          /\b(?:8|eight)[- ]?(?:to|–|-)[- ]?(?:10|ten)[- ]?(?:year|yr)[s]? experience\b/i,
          /\b(?:10|ten)\+[- ]?(?:year|yr)[s]? experience\b/i,
          /\bjunior\b/i,
          /\bmid[- ]level\b/i,
          /\bsenior\b/i,
          /\bprincipal\b/i,
          /\blead\b/i
        ];
        
        for (const pattern of experiencePatterns) {
          const match = jobDescText.match(pattern);
          if (match) {
            jobData.experienceLevel = match[0].trim();
            break;
          }
        }
      }
    }
    
    // Extract salary - multiple approaches
    // First try from dedicated salary sections
    const salarySelectors = [
      '.job-details-jobs-unified-top-card__job-insight span:contains("$"), .job-details-jobs-unified-top-card__job-insight span:contains("₹")',
      '.compensation, .salary',
      '.job-details-jobs-unified-top-card__salary-info'
    ];
    
    let foundSalary = false;
    
    // Try from job criteria or insights
    for (const section of jobInfoSections) {
      if (!section) continue;
      
      const label = section.querySelector('.description__job-criteria-subheader, .job-criteria__subheader');
      const value = section.querySelector('.description__job-criteria-text, .job-criteria__text');
      
      if (label && value) {
        const labelText = label.textContent?.trim().toLowerCase() || "";
        const valueText = value.textContent?.trim() || "";
        
        if (labelText.includes('salary') || labelText.includes('compensation') || labelText.includes('pay')) {
          jobData.salary = valueText;
          foundSalary = true;
          break;
        }
      }
    }
    
    // If salary not found in criteria, try from job insights
    if (!foundSalary) {
      const salaryElements = document.querySelectorAll('.job-details-jobs-unified-top-card__job-insight, .salary-top-card__salary-range');
      for (const element of salaryElements) {
        if (!element) continue;
        
        const text = element.textContent?.trim() || "";
        if (text.includes('$') || text.includes('₹') || text.includes('€') || 
            text.includes('£') || text.includes('¥') ||
            text.includes('salary') || text.includes('compensation') || 
            text.includes('/yr') || text.includes('/hour') || 
            text.includes('per year') || text.includes('per hour')) {
          jobData.salary = text;
          foundSalary = true;
          break;
        }
      }
    }
    
    // If salary still not found, search in job description
    if (!foundSalary) {
      const jobDescElement = document.querySelector('.jobs-description__content, #job-details');
      if (jobDescElement) {
        const jobDescText = jobDescElement.textContent || '';
        
        // Look for salary patterns in the job description
        const salaryPatterns = [
          /\$\s*[\d,]+\s*-\s*\$\s*[\d,]+\s*(?:per\s+year|per\s+annum|\/year|\/yr|a\s+year|annually)/i,
          /\$\s*[\d,]+\s*(?:per\s+year|per\s+annum|\/year|\/yr|a\s+year|annually)/i,
          /₹\s*[\d,]+\s*-\s*₹\s*[\d,]+\s*(?:per\s+year|per\s+annum|\/year|\/yr|a\s+year|annually)/i,
          /₹\s*[\d,]+\s*(?:per\s+year|per\s+annum|\/year|\/yr|a\s+year|annually)/i,
          /₹\s*[\d,\.]+\s*(?:lakh|lakhs|lpa)/i,
          /₹\s*[\d,\.]+\s*-\s*₹\s*[\d,\.]+\s*(?:lakh|lakhs|lpa)/i,
          /(?:[\d,\.]+|[\d,\.]+\s*-\s*[\d,\.]+)\s*(?:lakh|lakhs|lpa)/i,
          /salary\s*:\s*[\$₹€£¥]\s*[\d,]+\s*-\s*[\$₹€£¥]\s*[\d,]+/i,
          /compensation\s*:\s*[\$₹€£¥]\s*[\d,]+\s*-\s*[\$₹€£¥]\s*[\d,]+/i,
          /salary\s*[\$₹€£¥]\s*[\d,]+\s*-\s*[\$₹€£¥]\s*[\d,]+/i,
          /[\$₹€£¥]\s*[\d,]+\s*-\s*[\$₹€£¥]\s*[\d,]+\s*(?:per\s+month|monthly|\/month|\/mo|a\s+month)/i,
          /[\$₹€£¥]\s*[\d,]+\s*(?:per\s+month|monthly|\/month|\/mo|a\s+month)/i
        ];
        
        for (const pattern of salaryPatterns) {
          const match = jobDescText.match(pattern);
          if (match) {
            jobData.salary = match[0].trim();
            break;
          }
        }
      }
    }
    
    // Extract company size, if available
    const companySizeElements = document.querySelectorAll('.jobs-company__inline-information');
    for (const element of companySizeElements) {
      if (!element) continue;
      const text = element.textContent?.trim() || "";
      if (text.includes('employee')) {
        jobData.companySize = text;
        break;
      }
    }
    
    // Extract industry, if available
    const industryElements = document.querySelectorAll('.t-14.mt5');
    for (const element of industryElements) {
      if (!element) continue;
      const text = element.textContent?.trim() || "";
      if (!text.includes('employee') && !text.includes('LinkedIn')) {
        jobData.industry = text.split('\n')[0].trim();
        break;
      }
    }
    
    return jobData;
  } catch (error) {
    console.error("Error in LinkedIn extraction:", error);
    return jobData;
  }
}


/**
 * Extract job information from Indeed job pages
 * @param {Object} jobData - The default job data object to populate
 * @returns {Object} - The populated job data object
 */
function extractIndeedJobInfo(jobData) {
  try {
    // Extract job title
    // Try multiple selector patterns that might contain the job title
    const titleSelectors = [
      '.jobsearch-JobInfoHeader-title',
      'h1.icl-u-xs-mb--xs',
      'h1.jobsearch-JobInfoHeader-title',
      '[data-testid="jobsearch-JobInfoHeader-title"]',
      '[data-testid="simpler-jobTitle"]',
      '.css-dpa6rd',
      '.jobsearch-JobInfoHeader-title'
    ];
    
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        jobData.title = element.textContent.trim();
        break;
      }
    }
    
    // Extract company name
    const companySelectors = [
      '.jobsearch-InlineCompanyRating-companyName',
      '.jobsearch-EmployerInfoContainer .icl-u-lg-mr--sm',
      '[data-testid="company-name"]',
      '.jobsearch-JobInfoHeader-companyName',
      '.jobsearch-JobInfoHeader-companyNameSimple',
      '.css-88a4u1',
      '.companyName'
    ];
    
    for (const selector of companySelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        jobData.company = element.textContent.trim();
        break;
      }
    }
    
    // Extract location
    const locationSelectors = [
      '.jobsearch-JobInfoHeader-location',
      '[data-testid="jobsearch-JobInfoHeader-companyLocation"]',
      '.jobsearch-JobInfoHeader-subtitle .jobsearch-JobInfoHeader-text:not(:empty)',
      '.companyLocation',
      '.company_location',
      '.css-xb6x8x',
      '.css-5qwe7c'
    ];
    
    for (const selector of locationSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent.trim();
        // Skip if it contains number of reviews
        if (text && !text.includes('reviews')) {
          jobData.location = text;
          break;
        }
      }
      if (jobData.location !== "Unknown Location") break;
    }
    
    // Extract job type
    jobData.jobType = extractJobTypeFromIndeed();
    
    // Extract experience level
    jobData.experienceLevel = extractExperienceLevelFromIndeed();
    
    // Extract salary information
    jobData.salary = extractSalaryFromIndeed();
    
    return jobData;
  } catch (error) {
    console.error("Error in Indeed job extraction:", error);
    return jobData;
  }
}

/**
 * Extract job type from Indeed job page
 * @returns {string} - The job type or empty string if not found
 */
function extractJobTypeFromIndeed() {
  // These are common job type indicators to search for
  const jobTypeSelectors = [
    // Direct job type field
    '[data-testid="jobsearch-JobDescriptionSection-item"] [data-testid="jobsearch-JobDescriptionSection-value"]',
    '.jobsearch-JobDescriptionSection-sectionItem',
    '.jobDetails-term',
    '.css-1hj9xh6',
    // Look for the key-value pattern
    '.jobsearch-JobDescriptionSection-sectionItem'
  ];
  
  // Common job types to look for in text content
  const jobTypePatterns = [
    'Full-time', 
    'Part-time', 
    'Contract', 
    'Temporary', 
    'Permanent', 
    'Internship', 
    'Fresher',
    'Remote', 
    'Hybrid', 
    'On-site'
  ];
  
  // First try to find it directly
  for (const selector of jobTypeSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const parent = element.parentElement;
      // Check if this element or its parent contains "Job Type" label
      if (parent && parent.textContent.toLowerCase().includes('job type')) {
        const value = element.textContent.trim();
        if (value) return value;
      }
      
      // Check if the element itself is a job type
      for (const type of jobTypePatterns) {
        if (element.textContent.includes(type)) {
          return type;
        }
      }
    }
  }
  
  // If not found in dedicated fields, look in the job description
  const jobDescription = document.querySelector('#jobDescriptionText, .jobsearch-jobDescriptionText');
  if (jobDescription) {
    const text = jobDescription.textContent.toLowerCase();
    
    // Check for "Job Type:" pattern
    const jobTypeMatch = text.match(/job\s*type\s*:?\s*([^,;.]+)/i);
    if (jobTypeMatch && jobTypeMatch[1]) {
      return jobTypeMatch[1].trim();
    }
    
    // Check for common job type keywords
    for (const type of jobTypePatterns) {
      if (text.includes(type.toLowerCase())) {
        return type;
      }
    }
  }
  
  return '';
}

/**
 * Extract experience level from Indeed job page
 * @returns {string} - The experience level or empty string if not found
 */
function extractExperienceLevelFromIndeed() {
  // Look for these in headers, sidebars, or description content
  const experienceSelectors = [
    '.jobsearch-JobDescriptionSection-sectionItem',
    '.css-9thgde',
    '#jobDetailsSection'
  ];
  
  const experiencePatterns = [
    { pattern: /entry[- ]level/i, value: 'Entry Level' },
    { pattern: /junior/i, value: 'Junior' },
    { pattern: /mid[- ]level/i, value: 'Mid Level' },
    { pattern: /senior/i, value: 'Senior' },
    { pattern: /principal/i, value: 'Principal' },
    { pattern: /lead/i, value: 'Lead' },
    { pattern: /fresher/i, value: 'Fresher' },
    { pattern: /0[- ]year/i, value: '0 years experience' },
    { pattern: /no experience/i, value: 'No experience required' },
    { pattern: /(\d+)\+?\s*(\-|to)\s*(\d+)\+?\s*years?/i, value: null }, // Extracts "X to Y years"
    { pattern: /(\d+)\+?\s*years?/i, value: null }                      // Extracts "X+ years"
  ];
  
  // First check in job details section
  for (const selector of experienceSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = element.textContent.toLowerCase();
      
      // Check if this element contains experience label
      if (text.includes('experience') || text.includes('seniority')) {
        for (const {pattern, value} of experiencePatterns) {
          const match = text.match(pattern);
          if (match) {
            return value || match[0].trim();
          }
        }
      }
    }
  }
  
  // If not found in dedicated fields, try extracting from job description
  const jobDescription = document.querySelector('#jobDescriptionText, .jobsearch-jobDescriptionText');
  if (jobDescription) {
    const text = jobDescription.textContent.toLowerCase();
    
    // Check for "Experience:" pattern
    const expMatch = text.match(/experience\s*:?\s*([^,.;]+)/i);
    if (expMatch && expMatch[1]) {
      return expMatch[1].trim();
    }
    
    // Try to find experience patterns in the entire text
    for (const {pattern, value} of experiencePatterns) {
      const match = text.match(pattern);
      if (match) {
        // If it's a year range pattern, format it nicely
        if (pattern.toString().includes('\\d+') && match.length > 1) {
          if (match[2] && match[3]) { // X to Y years format
            return `${match[1]}-${match[3]} years experience`;
          }
          return `${match[1]} years experience`;
        }
        return value || match[0].trim();
      }
    }
  }
  
  return '';
}

/**
 * Extract salary information from Indeed job page
 * @returns {string} - The formatted salary or empty string if not found
 */
function extractSalaryFromIndeed() {
  // Common selectors for salary information
  const salarySelectors = [
    '[data-testid="jobsearch-JobDescriptionSection-item"] [data-testid="jobsearch-JobDescriptionSection-value"]',
    '.jobsearch-JobMetadataHeader-item',
    '.css-5zy3wn',
    '.css-1hj9xh6'
  ];
  
  // Common salary patterns to look for in text
  const salaryPatterns = [
    // Indian Rupee format: ₹X,XX,XXX - ₹X,XX,XXX per year/month
    /₹\s*([\d,]+)\s*-\s*₹\s*([\d,]+)\s*(per\s+year|per\s+month|per\s+annum|a\s+year|a\s+month|\/year|\/month|\/annum)/i,
    
    // Dollar format: $XX,XXX - $XX,XXX per year/month
    /\$\s*([\d,]+)\s*-\s*\$\s*([\d,]+)\s*(per\s+year|per\s+month|per\s+annum|a\s+year|a\s+month|\/year|\/month|\/annum)/i,
    
    // Euro format: €XX,XXX - €XX,XXX per year/month
    /€\s*([\d,]+)\s*-\s*€\s*([\d,]+)\s*(per\s+year|per\s+month|per\s+annum|a\s+year|a\s+month|\/year|\/month|\/annum)/i,
    
    // Generic currency symbol format
    /([₹$€£¥])\s*([\d,]+)\s*-\s*([₹$€£¥])\s*([\d,]+)/i,
    
    // Number only format with period indicator
    /([\d,]+)\s*-\s*([\d,]+)\s*(per\s+year|per\s+month|per\s+annum|a\s+year|a\s+month|\/year|\/month|\/annum)/i,
    
    // LPA (Lakhs Per Annum) format common in India
    /([\d.]+)\s*-\s*([\d.]+)\s*LPA/i,
    
    // Fixed salary (not a range)
    /([₹$€£¥])\s*([\d,]+)\s*(per\s+year|per\s+month|per\s+annum|a\s+year|a\s+month|\/year|\/month|\/annum)/i
  ];
  
  // First check in specific salary sections
  for (const selector of salarySelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const parent = element.parentElement;
      const text = element.textContent.trim();
      
      // If this is a salary field or looks like salary information
      if ((parent && parent.textContent.toLowerCase().includes('salary')) || 
          text.match(/[₹$€£¥]/) || 
          text.match(/per\s+(year|month|annum)/) ||
          text.includes('LPA')) {
        
        for (const pattern of salaryPatterns) {
          const match = text.match(pattern);
          if (match) {
            return text;
          }
        }
        
        // If none of the patterns match but it looks like salary, return it anyway
        if (text.match(/[₹$€£¥]/) || text.match(/per\s+(year|month|annum)/) || text.includes('LPA')) {
          return text;
        }
      }
    }
  }
  
  // If not found in dedicated fields, look in the job description
  const jobDescription = document.querySelector('#jobDescriptionText, .jobsearch-jobDescriptionText');
  if (jobDescription) {
    const text = jobDescription.textContent;
    
    // Check for "Salary:" pattern
    const salaryMatch = text.match(/salary\s*:?\s*([^.]*\b(?:year|month|annum|lpa)\b[^.]*)/i);
    if (salaryMatch && salaryMatch[1]) {
      return salaryMatch[1].trim();
    }
    
    // Try each salary pattern on the full text
    for (const pattern of salaryPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Determine how much context to include
        const matchText = match[0];
        const startIndex = Math.max(0, text.indexOf(matchText) - 10);
        const endIndex = Math.min(text.length, text.indexOf(matchText) + matchText.length + 10);
        
        // Return the matched text with some context
        return text.substring(startIndex, endIndex).trim();
      }
    }
  }
  
  return '';
}

/**
 * Glassdoor job extraction
 * This function extracts job details from Glassdoor job pages
 */
function extractGlassdoorJobInfo(jobData) {
  try {
    // Extract job title - multiple selectors to handle different page structures
    const titleSelectors = [
      '.jobDetails_jobDetailsHeader__Hd9M3 h1', // Primary selector from sample
      'h1#jd-job-title', // ID-based selector
      '.job-title', 
      '.jobViewMinimal .title', 
      '.css-1j389vi',
      '.css-17x2pwl',
      '[data-test="job-title"]'
    ];
    
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        jobData.title = element.textContent.trim();
        break;
      }
    }

    // Extract company name - multiple approaches
    const companySelectors = [
      '.EmployerProfile_employerNameHeading__bXBYr h4', // From sample
      '.employer-name', 
      '.jobViewMinimal .employer', 
      '.css-16nw49e', 
      '.css-1cjhpv5',
      '[data-test="employer-name"]'
    ];
    
    for (const selector of companySelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        jobData.company = element.textContent.trim();
        break;
      }
    }
    
    // Fallback method: company from structured data
    if (!jobData.company || jobData.company === "Unknown Company") {
      const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of structuredData) {
        try {
          const data = JSON.parse(script.textContent);
          if (data && data.hiringOrganization && data.hiringOrganization.name) {
            jobData.company = data.hiringOrganization.name;
            break;
          }
        } catch (e) {
          // Continue checking other script tags if one fails
          continue;
        }
      }
    }

    // Extract location
    const locationSelectors = [
      '.JobDetails_locationAndPay__XGFmY [data-test="location"]', // From sample
      '.location', 
      '.jobViewMinimal .location', 
      '.css-56kyx5', 
      '.css-1v5elnn',
      '[data-test="location"]'
    ];
    
    for (const selector of locationSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        jobData.location = element.textContent.trim();
        break;
      }
    }

    // Extract salary info
    const salarySelectors = [
      '.JobCard_salaryEstimate__QpbTW', // From sample
      '#jd-salary', 
      '[data-test="detailSalary"]',
      '.salary', 
      '.compensation', 
      '.css-1bluz6i'
    ];
    
    for (const selector of salarySelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        const salaryText = element.textContent.trim();
        // Clean up the salary text (remove "Glassdoor Est." or similar text)
        jobData.salary = salaryText.replace(/\(.*\)$/, '').trim();
        break;
      }
    }
    
    // Extract job type (full-time, part-time, etc.)
    const jobTypeSelectors = [
      '[data-test="employmentTypeLabel"]',
      '.jobDetails .d-flex:contains("Job Type")',
      '.job-info:contains("Employment Type")'
    ];
    
    // For custom contains-type selectors
    const allJobDetailElements = document.querySelectorAll('.jobDetails .d-flex, [data-test*="Type"], .job-info');
    for (const element of allJobDetailElements) {
      if (!element) continue;
      const text = element.textContent?.trim() || "";
      if (text.includes('Job Type') || text.includes('Employment Type')) {
        const colonIndex = text.indexOf(':');
        if (colonIndex !== -1) {
          jobData.jobType = text.substring(colonIndex + 1).trim();
          break;
        }
      }
    }
    
    // Extract experience level from job description
    const descriptionSelectors = [
      '.JobDetails_jobDescription__uW_fK',
      '.jobDescriptionContent',
      '[data-test="jobDesc"]'
    ];
    
    let descriptionText = '';
    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        descriptionText = element.textContent.trim();
        break;
      }
    }
    
    if (descriptionText) {
      // Look for experience patterns in the job description
      const experiencePatterns = [
        /(\d+)\+?\s*(?:to|-)\s*(\d+)\+?\s*years?\s+(?:of\s+)?experience/i,
        /(\d+)\+?\s*years?\s+(?:of\s+)?experience/i,
        /minimum\s+(?:of\s+)?(\d+)\+?\s*years?\s+experience/i,
        /(\d+)\+?\s*years?\s+minimum/i,
        /experience\s*:\s*(\d+)\+?\s*(?:to|-)\s*(\d+)\+?\s*years?/i,
        /experience\s*:\s*(\d+)\+?\s*years?/i,
        /entry[- ]level/i,
        /junior[- ]level/i,
        /mid[- ]level/i,
        /senior[- ]level/i,
        /experienced/i,
        /fresher/i,
        /no experience/i
      ];
      
      for (const pattern of experiencePatterns) {
        const match = descriptionText.match(pattern);
        if (match) {
          jobData.experienceLevel = match[0].trim();
          break;
        }
      }
    }
    
    // If job type was not found above, try to extract it from description
    if (!jobData.jobType && descriptionText) {
      const jobTypePatterns = [
        /full[- ]time/i,
        /part[- ]time/i,
        /contract/i,
        /temporary/i,
        /permanent/i,
        /freelance/i,
        /internship/i
      ];
      
      for (const pattern of jobTypePatterns) {
        const match = descriptionText.match(pattern);
        if (match) {
          jobData.jobType = match[0].trim();
          // Standardize job type format
          jobData.jobType = jobData.jobType.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
          jobData.jobType = jobData.jobType.charAt(0).toUpperCase() + jobData.jobType.slice(1);
          break;
        }
      }
    }
    
    // Extract remote/hybrid/on-site info if available
    const workplaceSelectors = [
      '[data-test="workplace-type"]',
      '.workplace-type',
      '.remote-status'
    ];
    
    for (const selector of workplaceSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        const workplaceType = element.textContent.trim();
        
        // If jobType is already set, append workplace info
        if (jobData.jobType) {
          jobData.jobType += ` (${workplaceType})`;
        } else {
          jobData.jobType = workplaceType;
        }
        break;
      }
    }
    
    // Look for remote/hybrid/onsite mentions in the description if not found above
    if ((!jobData.jobType || !jobData.jobType.match(/remote|hybrid|on-?site/i)) && descriptionText) {
      const workplacePatterns = [
        /remote work/i,
        /work from home/i,
        /wfh/i,
        /hybrid work/i,
        /hybrid model/i,
        /on-?site/i,
        /in-?office/i
      ];
      
      for (const pattern of workplacePatterns) {
        const match = descriptionText.match(pattern);
        if (match) {
          const workplaceInfo = match[0].trim();
          if (jobData.jobType) {
            jobData.jobType += ` (${workplaceInfo})`;
          } else {
            jobData.jobType = workplaceInfo;
          }
          break;
        }
      }
    }
    
  } catch (error) {
    console.error("Error in Glassdoor extraction:", error);
  }
  
  return jobData;
}

/**
 * ZipRecruiter job extraction
 * This function extracts job details from ZipRecruiter job pages
 */
function extractZipRecruiterJobInfo(jobData) {
  try {
    // Extract job title - multiple selectors to handle different page structures
    const titleSelectors = [
      '.job_header h1.job_title', // Primary selector from sample
      '.job_title',
      '.hiring_job_title',
      'h1.job-title',
      '[data-test="job-title"]',
      '.jobTitle'
    ];
    
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        jobData.title = element.textContent.trim();
        break;
      }
    }

    // Extract company name
    const companySelectors = [
      '.job_header .job_company', // From sample
      '.job_company',
      '.hiring_company', 
      '.company_name', 
      '.companyName',
      '[data-test="company-name"]'
    ];
    
    for (const selector of companySelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        jobData.company = element.textContent.trim().replace('at ', '');
        break;
      }
    }
    
    // Fallback: Try to extract from structured data
    if (!jobData.company || jobData.company === "Unknown Company") {
      const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of structuredData) {
        try {
          const data = JSON.parse(script.textContent);
          if (data && data.hiringOrganization && data.hiringOrganization.name) {
            jobData.company = data.hiringOrganization.name;
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    // Extract location
    const locationSelectors = [
      '.job_header .job_location', // From sample
      '.job_location',
      '.hiring_location', 
      '.location', 
      '.jobLocation'
    ];
    
    for (const selector of locationSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        jobData.location = element.textContent.trim();
        break;
      }
    }
    
    // Fallback: Try to extract location from address section
    if (!jobData.location || jobData.location === "Unknown Location") {
      const addressCity = document.querySelector('.company_details .name + *');
      if (addressCity && addressCity.textContent.trim()) {
        jobData.location = addressCity.textContent.trim();
      }
    }

    // Extract salary info
    const salarySelectors = [
      '.job_benefits_list .salary', // From sample
      '.job_salary',
      '.estimated_salary', 
      '.salaryOnly',
      '.compensation',
      '[data-test="salary"]'
    ];
    
    for (const selector of salarySelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        jobData.salary = element.textContent.trim();
        break;
      }
    }
    
    // Fallback: Try to find salary in FAQ section
    if (!jobData.salary) {
      const faqSalaryElements = document.querySelectorAll('.faq_question:contains("pay"), .faq_answer:contains("$")');
      for (const element of faqSalaryElements) {
        if (element && element.textContent.includes('$')) {
          const text = element.textContent.trim();
          // Extract salary using regex
          const salaryMatch = text.match(/\$\s*[\d,.]+\s*(to|[-–—])\s*\$?\s*[\d,.]+|pays?\s+\$\s*[\d,.]+/i);
          if (salaryMatch) {
            jobData.salary = salaryMatch[0].replace(/pays?\s+/i, '').trim();
            break;
          }
        }
      }
    }

    // Extract job type (full-time, part-time, etc.)
    const jobTypeSelectors = [
      '.job_benefits_list .employment_type', // From sample
      '.job_employment',
      '.employment_type', 
      '[data-test="job-type"]',
      '[data-test="employment-type"]'
    ];
    
    for (const selector of jobTypeSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        jobData.jobType = element.textContent.trim();
        break;
      }
    }
    
    // Look for "Employment Type: FULL_TIME" pattern at the end of job description
    if (!jobData.jobType) {
      const descElement = document.querySelector('.job_description');
      if (descElement) {
        const descText = descElement.textContent.trim();
        const typeMatch = descText.match(/Employment\s+Type:\s+([A-Z_]+)/i);
        if (typeMatch && typeMatch[1]) {
          // Convert FULL_TIME to Full-Time format
          const rawType = typeMatch[1];
          jobData.jobType = rawType
            .replace('_', '-')
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());
        }
      }
    }

    // Extract experience level from job description
    const descriptionSelectors = [
      '.job_description', 
      '.jobDescriptionSection'
    ];
    
    let descriptionText = '';
    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        descriptionText = element.textContent.trim();
        break;
      }
    }
    
    if (descriptionText) {
      // Look for qualifications/requirements section first
      const qualificationsMatch = descriptionText.match(/qualifications[\s\S]*?(\d+)[+]?\s*(?:to|[-–—])\s*(\d+)[+]?\s*years?|qualifications[\s\S]*?(\d+)[+]?\s*years?|requirements[\s\S]*?(\d+)[+]?\s*(?:to|[-–—])\s*(\d+)[+]?\s*years?|requirements[\s\S]*?(\d+)[+]?\s*years?/i);
      
      if (qualificationsMatch) {
        // Extract the portion containing the years of experience
        const fullMatch = qualificationsMatch[0];
        const expMatch = fullMatch.match(/(\d+)[+]?\s*(?:to|[-–—])\s*(\d+)[+]?\s*years?|(\d+)[+]?\s*years?/i);
        
        if (expMatch) {
          jobData.experienceLevel = expMatch[0].trim();
        }
      } else {
        // Look for experience patterns anywhere in the description
        const experiencePatterns = [
          /(\d+)\+?\s*(?:to|[-–—])\s*(\d+)\+?\s*years?\s+(?:of\s+)?experience/i,
          /(\d+)\+?\s*years?\s+(?:of\s+)?experience/i,
          /minimum\s+(?:of\s+)?(\d+)\+?\s*years?\s+experience/i,
          /(\d+)\+?\s*years?\s+minimum/i,
          /experience\s*:\s*(\d+)\+?\s*(?:to|[-–—])\s*(\d+)\+?\s*years?/i,
          /experience\s*:\s*(\d+)\+?\s*years?/i,
          /entry[- ]level/i,
          /junior[- ]level/i,
          /mid[- ]level/i,
          /senior[- ]level/i,
          /experienced/i,
          /fresher/i,
          /no experience/i
        ];
        
        for (const pattern of experiencePatterns) {
          const match = descriptionText.match(pattern);
          if (match) {
            jobData.experienceLevel = match[0].trim();
            break;
          }
        }
      }
    }
    
    // Extract remote/hybrid/on-site info if available in job type
    if (jobData.jobType) {
      const remotePatterns = [
        /remote/i,
        /work from home/i,
        /wfh/i,
        /hybrid/i,
        /on-?site/i,
        /in-?office/i
      ];
      
      for (const pattern of remotePatterns) {
        if (pattern.test(jobData.jobType)) {
          // Already included in job type, no need to modify
          break;
        }
      }
    }
    
    // If no remote info in job type, check description
    if (descriptionText && (!jobData.jobType || !(/remote|hybrid|on-?site|in-?office/i).test(jobData.jobType))) {
      const workplacePatterns = [
        /remote work/i,
        /work from home/i,
        /wfh/i,
        /hybrid work/i,
        /hybrid model/i,
        /on-?site/i,
        /in-?office/i
      ];
      
      for (const pattern of workplacePatterns) {
        const match = descriptionText.match(pattern);
        if (match) {
          const workplaceInfo = match[0].trim();
          if (jobData.jobType) {
            jobData.jobType += ` (${workplaceInfo})`;
          } else {
            jobData.jobType = workplaceInfo;
          }
          break;
        }
      }
    }
    
    // Extract industry if available
    const industrySelectors = [
      '.company_details .additional_text:contains("Industry") + p',
      '[data-test="industry"]'
    ];
    
    // Look for industry in the company details section
    const industryTextElements = document.querySelectorAll('.company_details h3.additional_text');
    for (const element of industryTextElements) {
      if (element && element.textContent.includes('Industry')) {
        const nextElement = element.nextElementSibling;
        if (nextElement && nextElement.textContent.trim()) {
          // Store industry in notes field as it's not a standard field
          if (!jobData.notes) jobData.notes = '';
          jobData.notes += `Industry: ${nextElement.textContent.trim()}\n`;
          break;
        }
      }
    }
    
    // Extract posted date if available
    const postedDateSelectors = [
      '.company_details .additional_text:contains("Posted date") + .posted_time',
      '.posted_date',
      '.job-age'
    ];
    
    // Look for posted date in the company details section
    const postedDateTextElements = document.querySelectorAll('.company_details h3.additional_text');
    for (const element of postedDateTextElements) {
      if (element && element.textContent.includes('Posted date')) {
        const nextElement = element.nextElementSibling;
        if (nextElement && nextElement.textContent.trim()) {
          // Store posted date in notes field
          if (!jobData.notes) jobData.notes = '';
          jobData.notes += `Posted date: ${nextElement.textContent.trim()}\n`;
          break;
        }
      }
    }
    
    // Extract benefits if available (not a standard field but useful info)
    const benefitsSelectors = [
      '.job_benefits_list .benefits'
    ];
    
    for (const selector of benefitsSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        // Store benefits in notes field
        if (!jobData.notes) jobData.notes = '';
        jobData.notes += `Benefits: ${element.textContent.trim()}\n`;
        break;
      }
    }
    
  } catch (error) {
    console.error("Error in ZipRecruiter extraction:", error);
  }
  
  return jobData;
}

/**
* Naukri job extraction
* This function extracts job details from Naukri.com job pages
*/
function extractNaukriJobInfo(jobData) {
  try {
    // Extract job title - multiple selectors to handle different page structures
    const titleSelectors = [
      '.styles_jd-header-title__rZwM1', // Primary selector from sample
      'h1.styles_jd-header-title__rZwM1',
      '.naukri-header-title',
      '.jd-header-title',
      'h1[title]',
      '.jobTitle'
    ];
    
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        jobData.title = element.textContent.trim();
        break;
      }
    }
 
    // Extract company name
    const companySelectors = [
      '.styles_jd-header-comp-name__MvqAI a', // From sample
      '.styles_jd-header-comp-name__MvqAI',
      '.companyInfo a',
      '.jd-header-comp-name',
      '.company-name',
      '[title*="Careers"]'
    ];
    
    for (const selector of companySelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        jobData.company = element.textContent.trim().replace(' Careers', '');
        break;
      }
    }
    
    // Extract location
    const locationSelectors = [
      '.styles_jhc__location__W_pVs', // From sample
      '.location',
      '.locality',
      '.styles_jhc__loc___Du2H',
      '.jd-location'
    ];
    
    for (const selector of locationSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        // Naukri often has multiple locations with links - extract all text
        const locationText = element.textContent.trim()
          .replace(/Jobs in/g, '')  // Remove "Jobs in" text
          .replace(/\s+/g, ' ')     // Normalize whitespace
          .trim();
        
        jobData.location = locationText;
        break;
      }
    }
    
    // If we got a complex location with multiple cities, try to simplify it
    if (jobData.location && jobData.location.includes(',')) {
      // If there are multiple locations, take the first one or combine
      const locationParts = jobData.location.split(',');
      if (locationParts.length <= 2) {
        jobData.location = jobData.location; // Keep as is if only 1-2 locations
      } else {
        // If more than 2 locations, show first one with +X more format
        jobData.location = `${locationParts[0].trim()} +${locationParts.length - 1} more`;
      }
    }
 
    // Extract salary info
    const salarySelectors = [
      '.styles_jhc__salary__jdfEC', // From sample
      '.salary',
      '.ctc',
      '.compensation',
      '[class*="salary"]'
    ];
    
    for (const selector of salarySelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        // Clean up salary text by removing icon text and extra spaces
        const salaryText = element.textContent.replace('₹', '').replace(/\s+/g, ' ').trim();
        jobData.salary = salaryText;
        break;
      }
    }
 
    // Extract experience level
    const experienceSelectors = [
      '.styles_jhc__exp__k_giM', // From sample
      '.experience',
      '.exp',
      '[class*="exp"]'
    ];
    
    for (const selector of experienceSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        // Clean up experience text by removing icon text
        const expText = element.textContent.replace(/\s+/g, ' ').trim();
        jobData.experienceLevel = expText;
        break;
      }
    }
    
    // Try to extract job type (full-time, part-time, etc.) and work mode (remote, hybrid, etc.)
    // Note: Naukri doesn't always clearly list job type in the structure provided
    
    // Look for job description to extract job type info
    const descriptionSelectors = [
      '.job-desc',
      '.jd-desc',
      '.styles_detail__U2rw4',
      '.jobDescription'
    ];
    
    let descriptionText = '';
    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        descriptionText = element.textContent.trim();
        break;
      }
    }
    
    if (descriptionText) {
      // Extract job type from description
      const jobTypePatterns = [
        /full[- ]time/i,
        /part[- ]time/i,
        /permanent/i,
        /temporary/i,
        /contract/i,
        /internship/i,
        /freelance/i
      ];
      
      for (const pattern of jobTypePatterns) {
        const match = descriptionText.match(pattern);
        if (match) {
          jobData.jobType = match[0].trim();
          break;
        }
      }
      
      // Try to extract remote/hybrid/on-site info
      const workModePatterns = [
        /remote work/i,
        /work from home/i,
        /wfh/i,
        /hybrid work/i,
        /hybrid model/i,
        /on-?site/i,
        /in-?office/i
      ];
      
      for (const pattern of workModePatterns) {
        const match = descriptionText.match(pattern);
        if (match) {
          const workModeInfo = match[0].trim();
          if (jobData.jobType) {
            jobData.jobType += ` (${workModeInfo})`;
          } else {
            jobData.jobType = workModeInfo;
          }
          break;
        }
      }
    }
    
    // Extract company address/location if available
    const addressSelectors = [
      '.styles_comp-info-detail__sO7Aw:contains("Address") span', // From sample
      '.company-address',
      '.address',
      '[class*="address"]'
    ];
    
    // For custom contains-type selectors
    const allAddressElements = document.querySelectorAll('.styles_comp-info-detail__sO7Aw');
    for (const element of allAddressElements) {
      if (!element) continue;
      const labelElement = element.querySelector('label');
      if (labelElement && labelElement.textContent.includes('Address')) {
        const spanElement = element.querySelector('span');
        if (spanElement && spanElement.textContent.trim()) {
          // Add to notes, as this isn't a standard field
          if (!jobData.notes) jobData.notes = '';
          jobData.notes += `Company Address: ${spanElement.textContent.trim()}\n`;
          break;
        }
      }
    }
    
    // Extract company website if available
    const websiteSelectors = [
      '.styles_comp-info-detail__sO7Aw:contains("Link") span a', // From sample
      '.company-website',
      '.website',
      '[class*="website"]'
    ];
    
    // For custom contains-type selectors
    const allWebsiteElements = document.querySelectorAll('.styles_comp-info-detail__sO7Aw');
    for (const element of allWebsiteElements) {
      if (!element) continue;
      const labelElement = element.querySelector('label');
      if (labelElement && labelElement.textContent.includes('Link')) {
        const linkElement = element.querySelector('span a');
        if (linkElement && linkElement.href) {
          // Add to notes
          if (!jobData.notes) jobData.notes = '';
          jobData.notes += `Company Website: ${linkElement.href}\n`;
          break;
        }
      }
    }
    
    // Extract company rating if available
    const ratingSelectors = [
      '.styles_rating-wrapper__jPmOo',
      '.rating',
      '.company-rating',
      '[class*="rating"]'
    ];
    
    for (const selector of ratingSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        const ratingText = element.textContent.trim();
        if (ratingText && !isNaN(parseFloat(ratingText))) {
          // Add to notes
          if (!jobData.notes) jobData.notes = '';
          jobData.notes += `Company Rating: ${ratingText}\n`;
          break;
        }
      }
    }
    
    // Extract skills if available (often found in Naukri job listings)
    const skillsSelectors = [
      '.key-skill',
      '.skills',
      '.tags',
      '[class*="skill"]',
      '[class*="tag"]'
    ];
    
    for (const selector of skillsSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        const skills = Array.from(elements).map(el => el.textContent.trim()).join(', ');
        
        // Add to notes
        if (skills) {
          if (!jobData.notes) jobData.notes = '';
          jobData.notes += `Skills: ${skills}\n`;
          break;
        }
      }
    }
    
    // Handle special salary formatting in Indian context (convert Lacs to standard format)
    if (jobData.salary && (jobData.salary.includes('Lac') || jobData.salary.includes('Lakh'))) {
      let formattedSalary = jobData.salary;
      
      // Extract numeric values with regex
      const lacMatch = formattedSalary.match(/([\d\.]+)[-\s]*(to)?[-\s]*([\d\.]+)?[\s]*Lac/i);
      if (lacMatch) {
        const minLac = parseFloat(lacMatch[1]);
        const maxLac = lacMatch[3] ? parseFloat(lacMatch[3]) : null;
        
        if (maxLac) {
          formattedSalary = `₹${minLac} - ${maxLac} Lakhs P.A.`;
        } else {
          formattedSalary = `₹${minLac} Lakhs P.A.`;
        }
        
        jobData.salary = formattedSalary;
      }
    }
    
  } catch (error) {
    console.error("Error in Naukri extraction:", error);
  }
  
  return jobData;
 }