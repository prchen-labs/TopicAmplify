import requests
from bs4 import BeautifulSoup

class crawler:
    __o_url=""
    __page=0
    __url=""
    __max_href=1000        
    __hrefs=[]
    __skip=[]
    
    def __init__(self,url,max_herf=1000,page=1):
        self.o_url=url
        self.page=page
        self.url=self.o_url.format(self.page)
        self.max_href=1000        
        self.hrefs=[]
        self.skip=[]
        
    def next_page(self):
        self.page+=1
        self.url=self.o_url.format(self.page)
        
    def add_skip_title(self,filename):
        skipfile=open(filename, mode="r", encoding="utf-8")
        tmp=skipfile.readline()
        while(tmp!=""):
            if(tmp not in self.skip):
                self.skip.append(tmp[:-1])
            tmp=skipfile.readline()
            
    def clear_skip_str(self):
        self.skip=[]
        
    def is_url(self,url):
        if("http://" in url or "https://" in url):
            return True
        return False
        
    def good_url(self,url):
        try:
            x = requests.get(url)
            if x.status_code == 200:
                return True
            return False
        except:
            return False
        
    def add_href(self,href):
        if href not in self.hrefs:
            if self.is_url(href):
                self.hrefs.append(href)

    def start(self):
        response = requests.get(self.url)
        soup = BeautifulSoup(response.text, "html.parser")
        result = soup.find_all("a",limit=self.max_href)
        for i in result:
            if i.get("title") is None :
                continue
            if i.get("title") in self.skip :
                continue
            self.add_href(i.get("href"))
        
    def get_hrefs(self):
        return self.hrefs
        
        
