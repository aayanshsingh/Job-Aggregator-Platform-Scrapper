// Updated content.js with enhanced job data extraction
// Constants
const TRACKER_BUTTON_ID = 'job-tracker-button';
const TRACKER_MODAL_ID = 'job-tracker-modal';

// Check if the current page is a job application page - Enhanced version
function isJobPage() {
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();
  const bodyText = document.body.innerText.toLowerCase();
  
  // URL patterns - expanded with more patterns
  const urlPatterns = [
    '/job/', '/jobs/', '/career', '/careers', '/apply', '/application', 
    'position', 'vacancy', 'opening', '/posting/', 'employment'
  ];
  const urlMatch = urlPatterns.some(pattern => url.includes(pattern));
  
  // Content patterns - expanded for better detection
  const contentPatterns = [
    'apply now', 'job description', 'qualifications', 'responsibilities', 
    'requirements', 'submit application', 'about the role', 'about this role', 
    'what you\'ll do', 'who you are', 'experience required', 'post a resume', 
    'upload resume', 'education requirements'
  ];
  const contentMatch = contentPatterns.some(pattern => bodyText.includes(pattern));
  
  // Title patterns - expanded
  const titlePatterns = [
    'job', 'career', 'position', 'opening', 'opportunity', 'employment', 
    'vacancy', 'hiring', 'recruitment'
  ];
  const titleMatch = titlePatterns.some(pattern => title.includes(pattern));
  
  return urlMatch || (contentMatch && titleMatch);
}

// Enhanced function to extract job information from the page
function extractJobInfo() {
  // Default job data with placeholder values and new fields
  let jobData = {
    title: "Unknown Position",
    company: "Unknown Company",
    location: "Unknown Location",
    url: window.location.href,
    dateApplied: new Date().toLocaleDateString(),
    salary: "",           // New field for salary information
    experienceLevel: "",  // New field for experience level
    jobType: "",          // New field for job type (full-time, part-time, etc.)
    notes: ""             // New field for additional notes
  };
  
  try {
    // First try site-specific extraction based on hostname
    extractSiteSpecificInfo(jobData);
    
    // For any fields that are still empty or unknown, use generic extraction
    if (jobData.title === "Unknown Position" || 
        jobData.company === "Unknown Company" || 
        jobData.location === "Unknown Location" ||
        !jobData.salary || 
        !jobData.experienceLevel || 
        !jobData.jobType) {
      
      extractGenericJobInfo(jobData);
    }
    
    // Clean and validate the extracted data
    return cleanJobData(jobData);
  } catch (error) {
    console.error("Error extracting job info:", error);
    // Return default data if extraction fails
    return jobData;
  }
}

// Process site-specific extraction based on hostname
function extractSiteSpecificInfo(jobData) {
  // Defensive site detection
  const hostname = window.location.hostname;
  if (!hostname) return;
  
  // Safely convert hostname to lowercase
  const hostnameStr = String(hostname).toLowerCase();

  // Call site-specific extractors based on hostname
  if (hostnameStr.includes('linkedin.com')) {
    extractLinkedInJobInfo(jobData);
  } else if (hostnameStr.includes('indeed.com')) {
    extractIndeedJobInfo(jobData);
  } else if (hostnameStr.includes('glassdoor.com')) {
    extractGlassdoorJobInfo(jobData);
  } else if (hostnameStr.includes('ziprecruiter.com')) {
    extractZipRecruiterJobInfo(jobData);
  } else if (hostnameStr.includes('naukri.com')) {
    extractNaukriJobInfo(jobData);
  } else if (hostnameStr.includes('monster.com')) {
    // You can add more site-specific extractors as needed
    extractGenericJobInfo(jobData);
  } else {
    // Use generic extraction for unsupported sites
    extractGenericJobInfo(jobData);
  }
}

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
    
    // IMPROVED: Extract salary with better validation
    let foundSalary = false;
    
    // 1. First check job criteria sections for salary information
    const jobInfoSection = document.querySelectorAll('.description__job-criteria-item, .job-criteria__item');
    for (const section of jobInfoSection) {
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
    
    // 2. If not found in criteria, use targeted selectors for salary-specific sections ONLY
    if (!foundSalary) {
      // These are very specific selectors that ONLY target salary information
      const salarySpecificSelectors = [
        '.salary-top-card__salary-range',
        '.job-details-jobs-unified-top-card__salary-info',
        '.compensation',
        '[data-test="compensation"]',
        '.job-details-jobs-unified-top-card__salary-details',
        '.jobs-unified-top-card__salary-details',
        '.jobs-details-jobs-unified-top-card__compensation-text',
        'span.jobs-details-job-summary__text--salary'
      ];
      
      for (const selector of salarySpecificSelectors) {
        const elements = document.querySelectorAll(selector);
        if (!elements || elements.length === 0) continue;
        
        for (const element of elements) {
          if (!element) continue;
          const text = element.textContent?.trim() || "";
          
          // Verify the text actually looks like a salary (contains currency or salary indicator words and numbers)
          if (text && isLikelySalary(text)) {
            jobData.salary = text;
            foundSalary = true;
            break;
          }
        }
        
        if (foundSalary) break;
      }
    }
    
    // 3. As a fallback with extra caution, check job insights but with very strict validation
    if (!foundSalary) {
      const insightElements = document.querySelectorAll('.job-details-jobs-unified-top-card__job-insight');
      
      for (const element of insightElements) {
        if (!element) continue;
        const text = element.textContent?.trim() || "";
        
        // Only accept text that DEFINITELY looks like a salary (must have currency symbol AND numbers)
        if (isDefinitelySalary(text)) {
          jobData.salary = text;
          foundSalary = true;
          break;
        }
      }
    }
    
    // 4. If salary still not found, look only in job description with strict patterns
    if (!foundSalary) {
      const jobDescElement = document.querySelector(
        '.jobs-description__content, .jobs-description-content__text, #job-details'
      );
      
      if (jobDescElement && jobDescElement.textContent) {
        const jobDescText = jobDescElement.textContent;
        // Only extract patterns that are definitely salaries
        const salaryMatch = extractSalaryFromDescription(jobDescText);
        
        if (salaryMatch) {
          jobData.salary = salaryMatch;
          foundSalary = true;
        }
      }
    }
    
    // If no valid salary found, leave it as empty string
    if (!foundSalary) {
      jobData.salary = '';
    }
    
    // ... [rest of your extraction code continues here] ...
    
    return jobData;
  } catch (error) {
    console.error("Error in LinkedIn extraction:", error);
    return jobData;
  }
}

/**
 * Stricter validation - text is LIKELY a salary
 * Requires some indication of being a salary (currency symbol, salary keywords, or
 * specific patterns) along with numeric content
 */
function isLikelySalary(text) {
  if (!text) return false;
  
  // Must have some numeric content
  if (!/\d/.test(text)) return false;
  
  const lowerText = text.toLowerCase();
  
  // Contains currency symbol
  if (/[$€£¥₹]/.test(text)) return true;
  
  // Contains salary keywords AND numbers in close proximity
  if ((lowerText.includes('salary') || 
       lowerText.includes('compensation') || 
       lowerText.includes('pay ') || 
       lowerText.includes(' pay') || 
       lowerText.includes('wage')) && 
      /\d/.test(text)) {
    return true;
  }
  
  // Has specific time period indicators with numbers
  const timePatterns = [
    'per year', 'per annum', 'annually', '/yr', 'a year',
    'per hour', 'hourly', '/hr', 'an hour',
    'per month', 'monthly', '/mo', 'a month'
  ];
  
  for (const pattern of timePatterns) {
    if (lowerText.includes(pattern) && /\d/.test(text)) {
      return true;
    }
  }
  
  // Has K notation
  if (/\d+k(-\d+k)?/i.test(lowerText)) {
    return true;
  }
  
  // Has LPA (Lakhs Per Annum) notation
  if (/\d+(\.\d+)?\s*lpa/i.test(lowerText)) {
    return true;
  }
  
  return false;
}

/**
 * Very strict validation - text is DEFINITELY a salary
 * Requires both currency symbols and numeric content
 */
function isDefinitelySalary(text) {
  if (!text) return false;
  
  // Must have both currency symbol and numbers
  if ((/[$€£¥₹]/.test(text)) && /\d/.test(text)) {
    return true;
  }
  
  // Must have numbers and explicit salary/compensation label
  const hasExplicitLabel = /salary|compensation/i.test(text);
  const hasRange = /\d+\s*-\s*\d+/i.test(text) || /\d+k\s*-\s*\d+k/i.test(text);
  
  if (hasExplicitLabel && hasRange) {
    return true;
  }
  
  // Must have LPA notation (common in India)
  if (/\d+(\.\d+)?\s*-\s*\d+(\.\d+)?\s*lpa/i.test(text)) {
    return true;
  }
  
  return false;
}

/**
 * Extract only very clear salary patterns from job description text
 */
function extractSalaryFromDescription(text) {
  if (!text) return null;
  
  // These patterns are designed to ONLY match actual salary information
  // with high confidence and avoid false positives
  const definiteSalaryPatterns = [
    // Dollar ranges with time period
    /\$\s*[\d,]+\s*-\s*\$\s*[\d,]+\s*(per\s+year|per\s+annum|\/year|\/yr|a\s+year|annually)/i,
    /\$\s*[\d,]+\s*-\s*\$\s*[\d,]+\s*(per\s+hour|\/hour|\/hr|an\s+hour)/i,
    /\$\s*[\d,]+\s*-\s*\$\s*[\d,]+\s*(per\s+month|monthly|\/month|\/mo|a\s+month)/i,
    
    // Dollar single values with time period
    /\$\s*[\d,]+\s*(per\s+year|per\s+annum|\/year|\/yr|a\s+year|annually)/i,
    /\$\s*[\d,]+\s*(per\s+hour|\/hour|\/hr|an\s+hour)/i,
    /\$\s*[\d,]+\s*(per\s+month|monthly|\/month|\/mo|a\s+month)/i,
    
    // Other currency ranges with time period
    /[€£¥₹]\s*[\d,]+\s*-\s*[€£¥₹]\s*[\d,]+\s*(per\s+year|per\s+annum|\/year|\/yr|a\s+year|annually)/i,
    /[€£¥₹]\s*[\d,]+\s*-\s*[€£¥₹]\s*[\d,]+\s*(per\s+hour|\/hour|\/hr|an\s+hour)/i,
    /[€£¥₹]\s*[\d,]+\s*-\s*[€£¥₹]\s*[\d,]+\s*(per\s+month|monthly|\/month|\/mo|a\s+month)/i,
    
    // Indian Rupee with lakhs
    /₹\s*[\d,\.]+\s*-\s*₹\s*[\d,\.]+\s*(lakh|lakhs|lpa)/i,
    /₹\s*[\d,\.]+\s*(lakh|lakhs|lpa)/i,
    
    // Explicit salary statements with currency
    /salary\s*:\s*[\$₹€£¥]\s*[\d,]+\s*-\s*[\$₹€£¥]\s*[\d,]+/i,
    /compensation\s*:\s*[\$₹€£¥]\s*[\d,]+\s*-\s*[\$₹€£¥]\s*[\d,]+/i,
    /salary\s+range\s*:\s*[\$₹€£¥]\s*[\d,]+\s*-\s*[\$₹€£¥]\s*[\d,]+/i,
    
    // K notation with currency
    /\$\s*[\d,]+k\s*-\s*\$\s*[\d,]+k/i,
    /\$\s*[\d,]+k/i
  ];
  
  for (const pattern of definiteSalaryPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Ensure the match doesn't contain too much text (avoid grabbing paragraphs)
      const matchText = match[0].trim();
      if (matchText.length < 100) {  // Reasonable length for a salary
        return matchText;
      }
    }
  }
  
  return null;
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

// Generic job info extraction for unsupported sites
function extractGenericJobInfo(jobData) {
  // Try to get job title
  if (jobData.title === "Unknown Position") {
    const potentialTitles = [
      ...document.querySelectorAll('h1'),
      ...document.querySelectorAll('h2'),
      ...document.querySelectorAll('[class*="title"i]'),
      ...document.querySelectorAll('[class*="position"i]'),
      ...document.querySelectorAll('[class*="job-name"i]'),
      ...document.querySelectorAll('[class*="jobTitle"i]')
    ];
    
    for (const element of potentialTitles) {
      const text = element.innerText.trim();
      if (text && text.length < 100) {
        jobData.title = text;
        break;
      }
    }
  }
  
  // Try to get company name
  if (jobData.company === "Unknown Company") {
    const potentialCompanies = [
      ...document.querySelectorAll('[class*="company"i]'),
      ...document.querySelectorAll('[class*="employer"i]'),
      ...document.querySelectorAll('[class*="organization"i]'),
      ...document.querySelectorAll('[id*="company"i]'),
      ...document.querySelectorAll('[id*="employer"i]')
    ];
    
    for (const element of potentialCompanies) {
      const text = element.innerText.trim();
      if (text && text.length < 50) {
        jobData.company = text;
        break;
      }
    }
  }
  
  // Try to get location
  if (jobData.location === "Unknown Location") {
    const potentialLocations = [
      ...document.querySelectorAll('[class*="location"i]'),
      ...document.querySelectorAll('[class*="address"i]'),
      ...document.querySelectorAll('[class*="region"i]'),
      ...document.querySelectorAll('[id*="location"i]'),
      ...document.querySelectorAll('span:contains("Location")')
    ];
    
    for (const element of potentialLocations) {
      const text = element.innerText.trim();
      if (text && text.length < 100) {
        jobData.location = text;
        break;
      }
    }
  }
  
  // Try to extract salary information
  if (!jobData.salary) {
    const potentialSalaries = [
      ...document.querySelectorAll('[class*="salary"i]'),
      ...document.querySelectorAll('[class*="compensation"i]'),
      ...document.querySelectorAll('[class*="pay"i]'),
      ...document.querySelectorAll('[id*="salary"i]')
    ];
    
    for (const element of potentialSalaries) {
      const text = element.innerText.trim();
      if (text && (text.includes('$') || text.includes('€') || text.includes('£') || 
                   text.includes('¥') || text.includes('₹') || 
                   text.includes('/yr') || text.includes('/hour') || 
                   text.includes('per year') || text.includes('salary'))) {
        jobData.salary = text;
        break;
      }
    }
    
    // If still no salary, try scanning the whole page for salary patterns
    if (!jobData.salary) {
      const bodyText = document.body.innerText;
      const salaryPatterns = [
        /\$\s*[\d,]+\s*-\s*\$\s*[\d,]+\s*(per\s+year|per\s+hour|per\s+month|\/year|\/hr|\/hour|\/mo|\/month|\/annum|a\s+year|an\s+hour)/i,
        /\$\s*[\d,]+\s*(per\s+year|per\s+hour|per\s+month|\/year|\/hr|\/hour|\/mo|\/month|\/annum|a\s+year|an\s+hour)/i,
        /[\d,]+\s*-\s*[\d,]+\s+(per\s+hour|\/hour|\/hr|an\s+hour)/i,
        /[\d,]+k?\s*-\s*[\d,]+k?\s+(per\s+year|\/year|\/yr|a\s+year|annually)/i,
        /[\d,]+k\s*-\s*[\d,]+k/i,
        /salary\s*:\s*\$\s*[\d,]+\s*-\s*\$\s*[\d,]+/i,
        /compensation\s*:\s*\$\s*[\d,]+\s*-\s*\$\s*[\d,]+/i
      ];
      
      for (const pattern of salaryPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          jobData.salary = match[0].trim();
          break;
        }
      }
    }
  }
  
  // Try to extract experience level
  if (!jobData.experienceLevel) {
    const potentialExperience = [
      ...document.querySelectorAll('[class*="experience"i]'),
      ...document.querySelectorAll('[class*="level"i]'),
      ...document.querySelectorAll('[id*="experience"i]')
    ];
    
    for (const element of potentialExperience) {
      const text = element.innerText.trim();
      if (text && (text.includes('year') || text.includes('yr') || 
                  text.includes('junior') || text.includes('senior') || 
                  text.includes('mid') || text.includes('entry'))) {
        jobData.experienceLevel = text;
        break;
      }
    }
    
    // If still no experience level, scan the page for experience patterns
    if (!jobData.experienceLevel) {
      const bodyText = document.body.innerText;
      const expPatterns = [
        /\d+\+?\s*(?:to|[-–—])\s*\d+\+?\s*years?\s+(?:of\s+)?experience/i,
        /\d+\+?\s*years?\s+(?:of\s+)?experience/i,
        /minimum\s+(?:of\s+)?\d+\+?\s*years?\s+experience/i,
        /\d+\+?\s*years?\s+minimum/i,
        /experience\s*:\s*\d+\+?\s*(?:to|[-–—])\s*\d+\+?\s*years?/i,
        /experience\s*:\s*\d+\+?\s*years?/i,
        /entry[- ]level/i,
        /junior[- ]level/i,
        /mid[- ]level/i,
        /senior[- ]level/i,
        /experienced/i,
        /fresher/i,
        /no experience/i
      ];
      
      for (const pattern of expPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          jobData.experienceLevel = match[0].trim();
          break;
        }
      }
    }
  }
  
  // Try to extract job type
  if (!jobData.jobType) {
    const potentialJobTypes = [
      ...document.querySelectorAll('[class*="job-type"i]'),
      ...document.querySelectorAll('[class*="employment-type"i]'),
      ...document.querySelectorAll('[id*="job-type"i]')
    ];
    
    for (const element of potentialJobTypes) {
      const text = element.innerText.trim();
      if (text && (text.includes('full-time') || text.includes('part-time') || 
                  text.includes('contract') || text.includes('permanent') || 
                  text.includes('temporary') || text.includes('intern'))) {
        jobData.jobType = text;
        break;
      }
    }
    
    // If still no job type, scan for job type patterns
    if (!jobData.jobType) {
      const bodyText = document.body.innerText;
      const jobTypePatterns = [
        /job\s+type\s*:?\s*(full[- ]time|part[- ]time|contract|temporary|permanent|internship)/i,
        /employment\s+type\s*:?\s*(full[- ]time|part[- ]time|contract|temporary|permanent|internship)/i,
        /\b(full[- ]time|part[- ]time|contract|temporary|permanent|internship)\b/i
      ];
      
      for (const pattern of jobTypePatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          if (match[1]) {
            jobData.jobType = match[1].trim();
          } else {
            jobData.jobType = match[0].trim();
          }
          break;
        }
      }
    }
    
    // Look for remote/hybrid/onsite indicators
    if (!jobData.jobType || !(jobData.jobType.toLowerCase().includes('remote') || 
                             jobData.jobType.toLowerCase().includes('hybrid') || 
                             jobData.jobType.toLowerCase().includes('onsite'))) {
      const bodyText = document.body.innerText.toLowerCase();
      if (bodyText.includes('remote work') || bodyText.includes('work from home') || bodyText.includes('wfh')) {
        if (jobData.jobType) {
          jobData.jobType += ', Remote';
        } else {
          jobData.jobType = 'Remote';
        }
      } else if (bodyText.includes('hybrid')) {
        if (jobData.jobType) {
          jobData.jobType += ', Hybrid';
        } else {
          jobData.jobType = 'Hybrid';
        }
      } else if (bodyText.includes('on-site') || bodyText.includes('onsite') || bodyText.includes('in office')) {
        if (jobData.jobType) {
          jobData.jobType += ', On-site';
        } else {
          jobData.jobType = 'On-site';
        }
      }
    }
  }
}

// Clean and validate job data
function cleanJobData(jobData) {
  // Helper function to clean text fields
  const cleanTextField = (text) => {
    if (!text) return text;
    return text
      .replace(/\s+/g, ' ')       // Replace multiple spaces with a single space
      .replace(/[\r\n]+/g, ' ')   // Remove line breaks
      .trim();                    // Trim whitespace
  };
  
  // Clean all text fields
  jobData.title = cleanTextField(jobData.title);
  jobData.company = cleanTextField(jobData.company);
  jobData.location = cleanTextField(jobData.location);
  jobData.salary = cleanTextField(jobData.salary);
  jobData.experienceLevel = cleanTextField(jobData.experienceLevel);
  jobData.jobType = cleanTextField(jobData.jobType);
  jobData.notes = cleanTextField(jobData.notes);
  
  // Truncate fields if they are too long
  if (jobData.title && jobData.title.length > 100) {
    jobData.title = jobData.title.substring(0, 97) + '...';
  }
  
  if (jobData.company && jobData.company.length > 50) {
    jobData.company = jobData.company.substring(0, 47) + '...';
  }
  
  if (jobData.location && jobData.location.length > 100) {
    jobData.location = jobData.location.substring(0, 97) + '...';
  }
  
  // Remove URL parameters and tracking info if it's too long
  if (jobData.url && jobData.url.length > 500) {
    try {
      const urlObj = new URL(jobData.url);
      jobData.url = urlObj.origin + urlObj.pathname;
    } catch (e) {
      // If URL parsing fails, just truncate
      jobData.url = jobData.url.substring(0, 500);
    }
  }
  
  // Ensure the company name doesn't contain words from the job title
  // (sometimes sites list "Company: Job Title" and we incorrectly extract both)
  if (jobData.company !== "Unknown Company" && jobData.title !== "Unknown Position") {
    const titleWords = jobData.title.toLowerCase().split(' ');
    if (titleWords.length > 2 && jobData.company.split(' ').length > 2) {
      // Check if company name contains most of the title words
      let matchCount = 0;
      titleWords.forEach(word => {
        if (word.length > 3 && jobData.company.toLowerCase().includes(word)) {
          matchCount++;
        }
      });
      
      // If most words match, it's likely not a real company name
      if (matchCount > titleWords.length * 0.7) {
        jobData.company = "Unknown Company";
      }
    }
  }
  
  return jobData;
}

// Create the tracker button
function createTrackerButton() {
  try {
    // Remove existing button if any
    const existingButton = document.getElementById(TRACKER_BUTTON_ID);
    if (existingButton) existingButton.remove();
    
    const button = document.createElement('button');
    button.id = TRACKER_BUTTON_ID;
    
    // Create a modern floating action button with improved briefcase icon
    button.innerHTML = `
      <div class="briefcase-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="briefcase-icon">
          <!-- Base of the briefcase -->
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" class="briefcase-base"></rect>
          <!-- Handle of the briefcase -->
          <path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" class="briefcase-handle"></path>
          <!-- Top of the briefcase (modified for better animation) -->
          <path d="M2 7h20" class="briefcase-top"></path>
          <!-- Paper sticking out (visible on hover) -->
          <path d="M9 14h6m-3-3v6" class="briefcase-paper" stroke-width="1.5"></path>
        </svg>
      </div>
    `;
    
    // Add CSS for modern design and improved animation
    const style = document.createElement('style');
    style.textContent = `
      #${TRACKER_BUTTON_ID} {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 28px;
        background-color: #1565C0;
        color: white;
        border: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                    box-shadow 0.25s ease;
        overflow: hidden;
      }
      
      .briefcase-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }
      
      .briefcase-icon {
        transition: transform 0.25s ease;
      }
      
      /* Hide the paper initially */
      .briefcase-paper {
        opacity: 0;
        transform: translateY(5px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      
      /* Top of briefcase animation */
      .briefcase-top {
        transform-origin: 12px 7px; /* Center origin for better animation */
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      /* Hover effects */
      #${TRACKER_BUTTON_ID}:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
      }
      
      /* Better top animation that looks correct */
      #${TRACKER_BUTTON_ID}:hover .briefcase-top {
        transform: scaleY(0.5) translateY(-2px);
      }
      
      /* Show paper on hover */
      #${TRACKER_BUTTON_ID}:hover .briefcase-paper {
        opacity: 1;
        transform: translateY(0);
      }
      
      #${TRACKER_BUTTON_ID}:active {
        transform: translateY(0) scale(0.95);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      
      /* Entrance animation */
      @keyframes buttonEntrance {
        0% { opacity: 0; transform: scale(0.5); }
        40% { transform: scale(1.15); }
        60% { transform: scale(0.95); }
        80% { transform: scale(1.05); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      #${TRACKER_BUTTON_ID}.entrance {
        animation: buttonEntrance 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      }
      
      /* Pulse animation on page load */
      @keyframes buttonPulse {
        0% { transform: scale(1); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
        50% { transform: scale(1.05); box-shadow: 0 5px 12px rgba(0, 0, 0, 0.3); }
        100% { transform: scale(1); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
      }
      
      #${TRACKER_BUTTON_ID}.pulse {
        animation: buttonPulse 1.5s ease infinite;
        animation-delay: 1s;
      }
    `;
    
    document.head.appendChild(style);
    
    // Preserve the original click handler
    button.addEventListener('click', buttonClickHandler);
    
    // Add button with entrance animation
    button.classList.add('entrance');
    document.body.appendChild(button);
    
    // Add pulsing effect after entrance animation completes
    setTimeout(() => {
      button.classList.add('pulse');
    }, 1000);
    
    // Basic position check
    checkButtonPosition(button);
    
    // Check position on window resize
    window.addEventListener('resize', function() {
      checkButtonPosition(button);
    });
    
    // Also check on scroll with throttling
    let lastScrollTime = 0;
    window.addEventListener('scroll', function() {
      const now = Date.now();
      if (now - lastScrollTime > 500) { // Check max every 500ms during scroll
        lastScrollTime = now;
        checkButtonPosition(button);
      }
    });
    
    // Check when DOM changes that might affect positioning
    const observer = new MutationObserver(function(mutations) {
      // Only check if mutations might affect positioning (added/removed nodes)
      const shouldCheck = mutations.some(mutation => 
        mutation.type === 'childList' || 
        (mutation.type === 'attributes' && 
         (mutation.attributeName === 'style' || mutation.attributeName === 'class'))
      );
      
      if (shouldCheck) {
        checkButtonPosition(button);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
  } catch (error) {
    console.error("Error creating tracker button:", error);
  }
}

// Rest of the content.js file remains the same...

// Create the tracker button
function createTrackerButton() {
  try {
    // Remove existing button if any
    const existingButton = document.getElementById(TRACKER_BUTTON_ID);
    if (existingButton) existingButton.remove();
    
    const button = document.createElement('button');
    button.id = TRACKER_BUTTON_ID;
    
    // Create a modern floating action button with improved briefcase icon
    button.innerHTML = `
      <div class="briefcase-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="briefcase-icon">
          <!-- Base of the briefcase -->
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" class="briefcase-base"></rect>
          <!-- Handle of the briefcase -->
          <path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" class="briefcase-handle"></path>
          <!-- Top of the briefcase (modified for better animation) -->
          <path d="M2 7h20" class="briefcase-top"></path>
          <!-- Paper sticking out (visible on hover) -->
          <path d="M9 14h6m-3-3v6" class="briefcase-paper" stroke-width="1.5"></path>
        </svg>
      </div>
    `;
    
    // Add CSS for modern design and improved animation
    const style = document.createElement('style');
    style.textContent = `
      #${TRACKER_BUTTON_ID} {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 28px;
        background-color: #1565C0;
        color: white;
        border: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                    box-shadow 0.25s ease;
        overflow: hidden;
      }
      
      .briefcase-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }
      
      .briefcase-icon {
        transition: transform 0.25s ease;
      }
      
      /* Hide the paper initially */
      .briefcase-paper {
        opacity: 0;
        transform: translateY(5px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      
      /* Top of briefcase animation */
      .briefcase-top {
        transform-origin: 12px 7px; /* Center origin for better animation */
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      /* Hover effects */
      #${TRACKER_BUTTON_ID}:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
      }
      
      /* Better top animation that looks correct */
      #${TRACKER_BUTTON_ID}:hover .briefcase-top {
        transform: scaleY(0.5) translateY(-2px);
      }
      
      /* Show paper on hover */
      #${TRACKER_BUTTON_ID}:hover .briefcase-paper {
        opacity: 1;
        transform: translateY(0);
      }
      
      #${TRACKER_BUTTON_ID}:active {
        transform: translateY(0) scale(0.95);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      
      /* Entrance animation */
      @keyframes buttonEntrance {
        0% { opacity: 0; transform: scale(0.5); }
        40% { transform: scale(1.15); }
        60% { transform: scale(0.95); }
        80% { transform: scale(1.05); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      #${TRACKER_BUTTON_ID}.entrance {
        animation: buttonEntrance 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      }
      
      /* Pulse animation on page load */
      @keyframes buttonPulse {
        0% { transform: scale(1); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
        50% { transform: scale(1.05); box-shadow: 0 5px 12px rgba(0, 0, 0, 0.3); }
        100% { transform: scale(1); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
      }
      
      #${TRACKER_BUTTON_ID}.pulse {
        animation: buttonPulse 1.5s ease infinite;
        animation-delay: 1s;
      }
    `;
    
    document.head.appendChild(style);
    
    // Preserve the original click handler
    button.addEventListener('click', buttonClickHandler);
    
    // Add button with entrance animation
    button.classList.add('entrance');
    document.body.appendChild(button);
    
    // Add pulsing effect after entrance animation completes
    setTimeout(() => {
      button.classList.add('pulse');
    }, 1000);
    
    // Basic position check
    checkButtonPosition(button);
    
    // Check position on window resize
    window.addEventListener('resize', function() {
      checkButtonPosition(button);
    });
    
    // Also check on scroll with throttling
    let lastScrollTime = 0;
    window.addEventListener('scroll', function() {
      const now = Date.now();
      if (now - lastScrollTime > 500) { // Check max every 500ms during scroll
        lastScrollTime = now;
        checkButtonPosition(button);
      }
    });
    
    // Check when DOM changes that might affect positioning
    const observer = new MutationObserver(function(mutations) {
      // Only check if mutations might affect positioning (added/removed nodes)
      const shouldCheck = mutations.some(mutation => 
        mutation.type === 'childList' || 
        (mutation.type === 'attributes' && 
         (mutation.attributeName === 'style' || mutation.attributeName === 'class'))
      );
      
      if (shouldCheck) {
        checkButtonPosition(button);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
  } catch (error) {
    console.error("Error creating tracker button:", error);
  }
}

// Check button position function remains the same
// Check button position function
function checkButtonPosition(button) {
  try {
    // Default position
    let bottom = 20;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Quick check for major elements in the bottom right
    const potentialElements = [
      'footer',
      '[id*="footer"]',
      '[class*="footer"]',
      '[id*="chat"]',
      '[class*="chat"]',
      '[id*="cookie"]',
      '[class*="cookie"]',
      '.fixed-bottom',
      '.sticky-bottom'
    ];
    
    // Check each type of element
    for (let selector of potentialElements) {
      const elements = document.querySelectorAll(selector);
      
      for (let el of elements) {
        const rect = el.getBoundingClientRect();
        
        // If element is visible and in bottom right area
        if (rect.width > 0 && rect.height > 0 && 
            rect.right > viewportWidth - 100 && 
            rect.bottom > viewportHeight - 100) {
          
          // Adjust our button to be above this element
          const spaceNeeded = viewportHeight - rect.top + 20;
          bottom = Math.max(bottom, spaceNeeded);
        }
      }
    }
    
    // Check for fixed/sticky elements that might not match our selectors
    const allFixedElements = Array.from(document.querySelectorAll('*')).filter(el => {
      if (el === button) return false; // Skip our button
      
      const style = window.getComputedStyle(el);
      return (style.position === 'fixed' || style.position === 'sticky') && 
             style.display !== 'none' && 
             style.visibility !== 'hidden';
    });
    
    for (let el of allFixedElements) {
      const rect = el.getBoundingClientRect();
      
      // If element is visible and in bottom right area
      if (rect.width > 0 && rect.height > 0 && 
          rect.right > viewportWidth - 100 && 
          rect.bottom > viewportHeight - 100) {
        
        // Adjust our button to be above this element
        const spaceNeeded = viewportHeight - rect.top + 20;
        bottom = Math.max(bottom, spaceNeeded);
      }
    }
    
    // LinkedIn specific check
    if (window.location.hostname.includes('linkedin')) {
      bottom = Math.max(bottom, 100);
    }
    
    // Cap the positioning to avoid going too high
    bottom = Math.min(bottom, 200);
    
    // Set the position
    button.style.bottom = bottom + 'px';
    
  } catch (error) {
    console.error("Error checking button position:", error);
    // Fallback position
    button.style.bottom = '20px';
  }
}

// Button click handler - made more robust against context invalidation
function buttonClickHandler(event) {
  // Show tracker modal directly without async operations
  showTrackerModalWithCheck();
}

// A more robust tracker modal that checks for duplicates internally
function showTrackerModalWithCheck() {
  try {
    const currentUrl = window.location.href;
    
    // Create a notification to show while checking
    const loadingNotification = document.createElement('div');
    loadingNotification.className = 'tracker-notification';
    loadingNotification.textContent = 'Checking application status...';
    document.body.appendChild(loadingNotification);
    
    // Try to check if job exists, but handle it gracefully if it fails
    chrome.runtime.sendMessage(
      { action: "checkJobExists", url: currentUrl },
      (response) => {
        // First remove the loading notification
        if (loadingNotification.parentNode) {
          loadingNotification.remove();
        }
        
        // Check for runtime errors (context invalidation)
        if (chrome.runtime.lastError) {
          console.warn("Runtime error, proceeding with normal modal:", chrome.runtime.lastError);
          showTrackerModal(); // Show normal modal if check fails
          return;
        }
        
        // If we got a response, use it
        if (response && response.exists) {
          showDuplicateWarning(response);
        } else {
          showTrackerModal();
        }
      }
    );
    
    // Set a timeout to show the normal modal if the check takes too long
    setTimeout(() => {
      if (loadingNotification.parentNode) {
        loadingNotification.remove();
        console.warn("Timeout waiting for check, showing normal modal");
        showTrackerModal();
      }
    }, 2000);
    
  } catch (error) {
    console.error("Error in showTrackerModalWithCheck:", error);
    showTrackerModal(); // Fallback to showing normal modal
  }
}

// Show duplicate warning modal
function showDuplicateWarning(existsCheck) {
  try {
    // Remove existing modal if any
    const existingModal = document.getElementById(TRACKER_MODAL_ID);
    if (existingModal) existingModal.remove();
    
    // Create modal element
    const modal = document.createElement('div');
    modal.id = TRACKER_MODAL_ID;
    
    let warningMessage = '';
    let actionButtons = '';
    
    if (existsCheck.inLogged) {
      warningMessage = `
        <div class="tracker-warning">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <p>You've already logged this job application.</p>
        </div>
      `;
      actionButtons = `
        <button id="tracker-view-logged-button">View in Dashboard</button>
        <button id="tracker-close-warning-button">Close</button>
      `;
    } else if (existsCheck.inSaved) {
      warningMessage = `
        <div class="tracker-warning">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <p>You've already saved this job for later.</p>
        </div>
      `;
      actionButtons = `
        <button id="tracker-log-anyway-button">Log Application</button>
        <button id="tracker-close-warning-button">Close</button>
      `;
    }
    
    modal.innerHTML = `
      <div class="tracker-modal-content">
        <div class="tracker-modal-header">
          <h3>Job Already Tracked</h3>
          <button class="tracker-close-button">&times;</button>
        </div>
        <div class="tracker-modal-body">
          ${warningMessage}
          <div class="tracker-actions duplicate-actions">
            ${actionButtons}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    addModalEventListeners(modal);
    
  } catch (error) {
    console.error("Error showing duplicate warning:", error);
  }
}

// Add event listeners to the modal
function addModalEventListeners(modal) {
  try {
    // Close button
    const closeBtn = modal.querySelector('.tracker-close-button');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.remove();
      });
    }
    
    // View logged button
    const viewLoggedBtn = modal.querySelector('#tracker-view-logged-button');
    if (viewLoggedBtn) {
      viewLoggedBtn.addEventListener('click', () => {
        try {
          // Open the extension popup
          chrome.runtime.sendMessage({ action: "openPopup" }, (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error opening popup:", chrome.runtime.lastError);
            }
          });
        } catch (error) {
          console.error("Error sending openPopup message:", error);
        }
        modal.remove();
      });
    }
    
    // Log anyway button
    const logAnywayBtn = modal.querySelector('#tracker-log-anyway-button');
    if (logAnywayBtn) {
      logAnywayBtn.addEventListener('click', () => {
        modal.remove();
        showTrackerModal();
      });
    }
    
    // Close warning button
    const closeWarningBtn = modal.querySelector('#tracker-close-warning-button');
    if (closeWarningBtn) {
      closeWarningBtn.addEventListener('click', () => {
        modal.remove();
      });
    }
  } catch (error) {
    console.error("Error adding modal event listeners:", error);
  }
}

// Create and show tracker modal
function showTrackerModal() {
  try {
    const jobData = extractJobInfo();
    
    // Remove existing modal if any
    const existingModal = document.getElementById(TRACKER_MODAL_ID);
    if (existingModal) existingModal.remove();
    
    // Create modal element
    const modal = document.createElement('div');
    modal.id = TRACKER_MODAL_ID;
    
    // Sanitize input values to prevent HTML issues
    const sanitizeText = (text) => {
      if (typeof text !== 'string') return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };
    
    modal.innerHTML = `
      <div class="tracker-modal-content">
        <div class="tracker-modal-header">
          <h3>Job Application Tracker</h3>
          <button class="tracker-close-button">&times;</button>
        </div>
        <div class="tracker-modal-body">
          <div class="tracker-job-info">
            <div class="job-field-group">
              <label for="job-title">Job Title</label>
              <div class="editable-field">
                <input type="text" id="job-title" value="${sanitizeText(jobData.title)}" readonly>
                <button class="edit-field-button" data-field="job-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="job-field-group">
              <label for="job-company">Company</label>
              <div class="editable-field">
                <input type="text" id="job-company" value="${sanitizeText(jobData.company)}" readonly>
                <button class="edit-field-button" data-field="job-company">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="job-field-group">
              <label for="job-location">Location</label>
              <div class="editable-field">
                <input type="text" id="job-location" value="${sanitizeText(jobData.location)}" readonly>
                <button class="edit-field-button" data-field="job-location">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- New field: Job Type -->
    <div class="job-field-group">
      <label for="job-type">Job Type</label>
      <div class="editable-field">
        <input type="text" id="job-type" value="${sanitizeText(jobData.jobType)}" readonly>
        <button class="edit-field-button" data-field="job-type">
          <!-- Edit button icon -->
        </button>
      </div>
    </div>
    
    <!-- New field: Experience Level -->
    <div class="job-field-group">
      <label for="job-experience">Experience Level</label>
      <div class="editable-field">
        <input type="text" id="job-experience" value="${sanitizeText(jobData.experienceLevel)}" readonly>
        <button class="edit-field-button" data-field="job-experience">
          <!-- Edit button icon -->
        </button>
      </div>
    </div>
    
    <!-- New field: Salary -->
    <div class="job-field-group">
      <label for="job-salary">Salary</label>
      <div class="editable-field">
        <input type="text" id="job-salary" value="${sanitizeText(jobData.salary)}" readonly>
        <button class="edit-field-button" data-field="job-salary">
          <!-- Edit button icon -->
        </button>
      </div>
    </div>
    
    <!-- Original date field -->
    
    <!-- New field: Notes -->
    <div class="job-field-group">
      <label for="job-notes">Notes</label>
      <div class="editable-field">
        <textarea id="job-notes" readonly>${sanitizeText(jobData.notes)}</textarea>
        <button class="edit-field-button" data-field="job-notes">
          <!-- Edit button icon -->
        </button>
      </div>
    </div>
            
            <div class="job-field-group">
              <label for="job-date">Date</label>
              <input type="text" id="job-date" value="${sanitizeText(jobData.dateApplied)}" readonly>
            </div>
          </div>
          <div class="tracker-actions">
            <button id="tracker-log-button">Log Application</button>
            <button id="tracker-save-button">Save for Later</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add main modal event listeners
    addMainModalEventListeners(modal, jobData);
    
  } catch (error) {
    console.error("Error showing tracker modal:", error);
    showNotification("Error showing tracker. Please try again.");
  }
}

// Add event listeners to the main modal
function addMainModalEventListeners(modal, jobData) {
  try {
    // Close button
    const closeBtn = modal.querySelector('.tracker-close-button');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.remove();
      });
    }
    
    // Edit buttons
    const editButtons = modal.querySelectorAll('.edit-field-button');
    if (editButtons) {
      editButtons.forEach(button => {
        button.addEventListener('click', handleEditButtonClick);
      });
    }
    
    // Log button
    const logButton = modal.querySelector('#tracker-log-button');
    if (logButton) {
      logButton.addEventListener('click', () => {
        try {
          const updatedJobData = collectFormData(jobData);
          
          chrome.runtime.sendMessage(
            { action: "logApplication", jobData: updatedJobData },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error("Error logging application:", chrome.runtime.lastError);
                showNotification("Error saving application. Please try again.");
              } else {
                showNotification(response.message);
              }
              modal.remove();
            }
          );
        } catch (error) {
          console.error("Error in log button handler:", error);
          showNotification("Error saving application. Please try again.");
          modal.remove();
        }
      });
    }
    
    // Save button
    const saveButton = modal.querySelector('#tracker-save-button');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        try {
          const updatedJobData = collectFormData(jobData);
          
          chrome.runtime.sendMessage(
            { action: "saveForLater", jobData: updatedJobData },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error("Error saving application:", chrome.runtime.lastError);
                showNotification("Error saving application. Please try again.");
              } else {
                showNotification(response.message);
              }
              modal.remove();
            }
          );
        } catch (error) {
          console.error("Error in save button handler:", error);
          showNotification("Error saving application. Please try again.");
          modal.remove();
        }
      });
    }
  } catch (error) {
    console.error("Error adding main modal event listeners:", error);
  }
}

// Handle edit button click
function handleEditButtonClick(e) {
  try {
    const fieldId = e.currentTarget.getAttribute('data-field');
    const inputField = document.getElementById(fieldId);
    
    if (!inputField) return;
    
    // Toggle readonly attribute
    if (inputField.hasAttribute('readonly')) {
      inputField.removeAttribute('readonly');
      inputField.focus();
      inputField.select();
      
      // Change button to save button
      e.currentTarget.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
      `;
    } else {
      inputField.setAttribute('readonly', true);
      
      // Change button back to edit button
      e.currentTarget.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
        </svg>
      `;
    }
  } catch (error) {
    console.error("Error handling edit button click:", error);
  }
}

// Collect form data from the modal
function collectFormData(originalJobData) {
  try {
    const updatedJobData = {
      title: document.getElementById('job-title')?.value || originalJobData.title,
      company: document.getElementById('job-company')?.value || originalJobData.company,
      location: document.getElementById('job-location')?.value || originalJobData.location,
      dateApplied: document.getElementById('job-date')?.value || originalJobData.dateApplied,
      url: originalJobData.url,
      // New fields
      jobType: document.getElementById('job-type')?.value || originalJobData.jobType || '',
      experienceLevel: document.getElementById('job-experience')?.value || originalJobData.experienceLevel || '',
      salary: document.getElementById('job-salary')?.value || originalJobData.salary || '',
      notes: document.getElementById('job-notes')?.value || originalJobData.notes || ''
    };
    return updatedJobData;
  } catch (error) {
    console.error("Error collecting form data:", error);
    return originalJobData;
  }
}

// Show a temporary notification
function showNotification(message) {
  try {
    const notification = document.createElement('div');
    notification.className = 'tracker-notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 500);
    }, 3000);
  } catch (error) {
    console.error("Error showing notification:", error);
  }
}

// Initialize on page load
function initialize() {
  try {
    if (isJobPage()) {
      createTrackerButton();
    }
  } catch (error) {
    console.error("Error initializing extension:", error);
  }
}

// Run when page is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Create MutationObserver with error handling
let observer;
try {
  observer = new MutationObserver((mutations) => {
    try {
      if (isJobPage() && !document.getElementById(TRACKER_BUTTON_ID)) {
        createTrackerButton();
      }
    } catch (error) {
      console.error("Error in MutationObserver callback:", error);
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
} catch (error) {
  console.error("Error setting up MutationObserver:", error);
  // Fallback to periodic checks
  setInterval(() => {
    try {
      if (isJobPage() && !document.getElementById(TRACKER_BUTTON_ID)) {
        createTrackerButton();
      }
    } catch (error) {
      console.error("Error in interval check:", error);
    }
  }, 2000);
}

// Clean up on unload
window.addEventListener('beforeunload', () => {
  try {
    if (observer) {
      observer.disconnect();
    }
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
});