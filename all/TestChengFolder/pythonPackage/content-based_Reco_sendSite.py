import requests
import sys
import os
# print("the parameters ",str(sys.argv))
from ckipnlp.pipeline import CkipPipeline, CkipDocument
from collections import Counter
import re
import json

# url = 'http://www.topicamplify.com:7001' # 要發送的網址
# data = {'message': 'Hello, World!'} # 要發送的數據
# response = requests.post(url, data=data) # 發送POST請求
# print(response.status_code) # 顯示回應的狀態碼

current_path = os.getcwd()
print("當前路徑為：", current_path)


pipeline = CkipPipeline(opts={'con_parser': {'username': os.environ["CKIP_USERNAME"], 'password': os.environ["CKIP_PASSWORD"]}})
# 無主題式詞 (用在特徵選取後)

# with open("../stopWords/meaningless.json", "r", encoding="utf-8") as f:
with open("/home/jupyter-selab/express/Express-Node/TestChengFolder/stopWords/meaningless.json", "r", encoding="utf-8") as f:
    stopwords=json.load(f)
RemoveTheMeaningless=[]
for word in stopwords:
  RemoveTheMeaningless=set(word.get("stopwords", []))# 用set防止重複的東西

# 同義詞清單
synonymsDocument="/home/jupyter-selab/express/Express-Node/TestChengFolder/stopWords/synonyms.json"
# 讀取同義詞JSON檔案 key:arraylist
with open(synonymsDocument, 'r', encoding='utf-8') as f:
    synonyms = json.load(f)
# print(synonyms)
# 只准許的詞性
valid_pos = {"Na", "Nb", "Nc", "Nv", "VA", "VAC", "VB", "VC", "VCL", "VD", "VE", "VF", "VG", "VH", "VHC", "VI", "VJ", "VK", "VL"}
BanSthwithEntity_Types=['PERSON','LOC','GPE']
HFW_rank=10 # High Frequency Word only rank to 10 = 關鍵字 = (經特徵選取後的)特徵字

# 預編譯正則表達式
replace_pattern = re.compile(r'^(?=.{2,}).*盃$')
remove_pattern = re.compile(r'^(?!会|人|金枝演)(^.+社$)$')

# pipeline = CkipPipeline(opts={'con_parser': {'username': "<CKIP_USERNAME>", 'password': "<CKIP_PASSWORD>"}})
# pipeline = CkipPipeline()  # create a CKIP pipeline object
def preprocess_text(text):
    # 刪除英文 CKIP搞不定外文，還會結合在一起標FW
    text = re.sub(r'[a-zA-Z]', ' ', text)
    doc = CkipDocument(raw=text) # 將一段文字轉換成 CkipTagger 能夠處理的文件形式
    ws_text=pipeline.get_ws(doc)
    pos_text=pipeline.get_pos(doc)
     # 作實體識別(用於判別人名)
    ner_text = pipeline.get_ner(doc)
    # 只選特定詞性(同時篩掉停用詞)
    featureWord=[]
    for i,sent_p in enumerate(pos_text):
      for j,word_p in enumerate(sent_p):
        # if ner_text[i][j]=='PERSON':
        #   continue
        if word_p in valid_pos and ws_text[i][j] not in RemoveTheMeaningless:
            featureWord.append(ws_text[i][j])
    
    # 替換同義詞
    item_text = ' '.join(featureWord)
    for key, values in synonyms.items():
        for value in values:
            item_text = item_text.replace(value, key)
    featureWord = item_text.split()
    # 使用預編譯正則表達式
    featureWord = [replace_pattern.sub('比賽', c) for c in featureWord]
    featureWord = [remove_pattern.sub('社團', c) for c in featureWord]

    # 禁人名/LOC/GPE出現在featureWord的清單(list-banSth)
    banSth=[] # PersonName or LOC or GPE
    # print("ner_text\n",ner_text)
    for i, sent_ner in enumerate(ner_text):
      # print("sent_ner\n",sent_ner)
      for j, ner in enumerate(sent_ner):
        # print("ner\n",ner)
        # print("ner[1]\n",ner[1])
        if ner[1] in BanSthwithEntity_Types:
          banSth.append(ner[0])
          # print("ner\n",ner)
    # 只留中文字
    newfeatureWord = []
    pattern = re.compile(r'[\u4e00-\u9fff]+')
    for word in featureWord:
      # 把列表中的每個單詞轉成字符串再進行匹配
      matched_words = pattern.findall(str(word))# 我覺得跟str有關
      # 把匹配到的單詞加入到新列表中
      newfeatureWord.extend(matched_words)
    featureWord=newfeatureWord

    # 禁在清單內的東西
    if len(banSth):# 有東西，長度不為0，執行；有人名被禁，禁人名清單長度不為0，執行
      featureWord=[w for w in featureWord if w not in banSth]
    # # 檢查關鍵字用
    # if len(featureWord)>20:
    #   print(f"In {counterFor} featureWord is many reaching {len(featureWord)}\n",featureWord)
    # # 無意義文本不放
    # if len(featureWord)==0:
    #   print(f"In {counterFor} of {json_file} featureWord is Error",)
    #   print(f"Error: featureWord is empty",)
    return featureWord
    
new_text = '測試測試這是文本this is a new document for topic prediction 搜尋活動'
print(new_text)

# 預處理新文本，建立詞彙表
new_doc = preprocess_text(new_text)
print(new_doc)