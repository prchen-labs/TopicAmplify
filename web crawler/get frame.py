import requests
from bs4 import BeautifulSoup

max_href=1000
hrefs=[]
url=r"https://www.nuk.edu.tw/p/403-1000-102-1.php"
skipfile=open("nuk-skip.txt", mode="w", encoding="utf-8")
response = requests.get(url)
soup = BeautifulSoup(response.text, "html.parser")
result = soup.find_all("a",limit=max_href)
titles=[]
for i in result:
    title = i.get("title")
    if title is not None:
        if title not in titles :
            titles.append(title)
            skipfile.write(title)
            skipfile.write("\n")
        
skipfile.close()
