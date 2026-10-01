def longestCommonSubsequence(text1: str, text2: str):
    m=len(text1)
    n=len(text2)
    dp=[[0]*(m+1) for i in range(n+1)]
    prev=[0]*(m+1)
    for i in range(1,n+1):
        curr=[0]*(m+1)
        for j in range(1,m+1):
            if text2[i-1]==text1[j-1]:
                curr[j]=prev[j-1]+1
            else:
                curr[j]=max(prev[j],curr[j-1])
        prev=curr
    return prev[m]
    
def similar(a,b,threshold=0.7):
    sub = longestCommonSubsequence(a,b)
    #print(a + ";" + b + "=" + str(sub))
    return sub / max(len(a),len(b)) > threshold