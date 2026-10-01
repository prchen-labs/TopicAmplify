from event_crawler import crawler
import webbrowser

url=r"https://www.nuk.edu.tw/p/403-1000-102-{}.php"
page=12
skipfile=r"nuk-skip.txt"
out="nuk.txt"
nkust=crawler(url)

for i in range(page):
    print(i)
    nkust.add_skip_title(skipfile)
    nkust.start()
    nkust.next_page()
    
hrefs=nkust.get_hrefs()
f=open(out,mode='w')
print(len(hrefs))
for i in hrefs:
    f.write(i+"\n")
    #webbrowser.open(i, new=2)
    print(i)
f.close()
