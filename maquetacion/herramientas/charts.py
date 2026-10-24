import re,sys,json
out={}
for k in range(1,6):
    x=open(f'{sys.argv[2]}/word/charts/chart{k}.xml',encoding='utf8').read()
    typ=re.search(r'<c:(\w+)Chart>',x).group(1)
    bardir=re.search(r'<c:barDir val="(\w+)"',x)
    series=[]
    for s in re.findall(r'<c:ser>(.*?)</c:ser>',x,re.S):
        name=re.findall(r'<c:tx>.*?<c:v>(.*?)</c:v>',s,re.S)
        cat=re.search(r'<c:cat>(.*?)</c:cat>',s,re.S); val=re.search(r'<c:val>(.*?)</c:val>',s,re.S)
        cats=re.findall(r'<c:v>(.*?)</c:v>',cat.group(1)) if cat else []
        vals=[float(v) for v in re.findall(r'<c:v>(.*?)</c:v>',val.group(1))] if val else []
        series.append({'name':name[0] if name else '','values':vals,'cats':cats})
    out[f'chart{k}']={'type':typ,'dir':bardir.group(1) if bardir else None,'categories':series[0]['cats'],'series':[{'name':s['name'],'values':s['values']} for s in series]}
json.dump(out,open(sys.argv[1],'w'),ensure_ascii=False,indent=1)
for k,v in out.items(): print(k,v['type'],v['dir'],v['categories'][:6],[ (s['name'],s['values'][:6]) for s in v['series']])
