import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

class crawler:
    __htmlpath=""
    __max_href=10000    
    __hrefs=[]
    __skip=[]
    __url=""
    
    def __init__(self,htmlpath,url,max_herf=10000):
        self.htmlpath=htmlpath
        self.url=url
        self.max_href=max_herf     
        self.hrefs=[]
        self.skip=[]
        
    def add_skip_title(self,filename):
        skipfile=open(filename, mode="r", encoding="utf-8")
        tmp=skipfile.readline()
        while(tmp!=""):
            if(tmp not in self.skip):
                self.skip.append(tmp[:-1])
            tmp=skipfile.readline()
            
    def clear_skip_str(self):
        self.skip=[]
        
        
    def good_url(self,url):
        try:
            x = requests.get(url)
            if x.status_code == 200:
                return True
            return False
        except:
            return False
        
    def add_href(self,href):
        if("http://" not in href and "https://" not in href):
            href = urljoin(self.url,href)
            if not self.good_url(href):
                return
        if href not in self.hrefs:
            self.hrefs.append(href)

    def start(self):
        print(self.htmlpath)
        f=open(self.htmlpath, mode="r", encoding="utf-8")
        soup = BeautifulSoup(f.read(), "html.parser")
        result = soup.find_all("a",limit=self.max_href)
        for i in result:
            if i.get_text() is None :
                continue
            if i.get_text() in self.skip :
                continue
            if i.get("href") == None:
                continue
            self.add_href(i.get("href"))
        
    def get_hrefs(self):
        return self.hrefs
        
        
