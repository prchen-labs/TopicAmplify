# -*- coding: utf-8 -*-

import json
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


        
def get_html(url):
    chrome_options = Options() 
    chrome_options.add_argument('--headless')
    driver = webdriver.Chrome(options=chrome_options)# or add to your PATH
    #driver.set_window_size(1920, 1080) # optional
    driver.get(url)
    html = driver.page_source
    driver.quit()
    return html

def get_title(soup):    
    title = soup.find("title")
    return title.string

def get_content(soup):
    content_html = soup.find("main")
    contents=content_html.get_text()
    content=""
    for i in contents.splitlines():
        if(i!=""):
            content += i + "\n"
    return content

limit=1000
filename="nkust.txt"
skipfile=open(filename, mode="r", encoding="utf-8")
tmp=skipfile.readline()
topics=[]
while(tmp!="" and limit>0):
    print(tmp,end="")
    response = get_html(tmp)
    soup = BeautifulSoup(response, "html.parser")
    title = get_title(soup)
    content=get_content(soup)
    topics.append({"title": title, "content": content})    
    tmp=skipfile.readline()
    limit-=1
out=open("nkust-topic.json", mode="w", encoding="utf-8")
out.write(json.dumps(topics,ensure_ascii=False))
out.close()


