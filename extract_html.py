from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager

# Setup Chrome
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))

# Go to the site
url = "https://in.indeed.com/?from=gnav-homepage&vjk=9efe36e1ca11dd4f&advn=4357332925275837"  # Replace with real URL
driver.get(url)

# Maximize window to make login easier (optional)
driver.maximize_window()

# Wait for you to manually log in
input("🔐 Please log in manually in the browser window, then press Enter here...")

# Wait a bit to make sure job posts load (can be adjusted)
driver.implicitly_wait(5)

# Now get the full HTML
html = driver.page_source
print(html)

# Save to file (optional)
with open("output.html", "w", encoding="utf-8") as f:
    f.write(html)

# Done
driver.quit()
