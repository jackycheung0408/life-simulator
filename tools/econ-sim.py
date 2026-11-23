#!/usr/bin/env python3
"""小豬鎮 6 人小鎮貨幣量試算（離線，不連正式站）。python3 tools/econ-sim.py [天數] [種子數]
情境：A 基準（現行）；B 加鎮基金每週回流；C B＋自動調節器；D C＋新出口（富人奢侈品／慈善）。"""
import random, sys, statistics as st
DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 180
SEEDS = int(sys.argv[2]) if len(sys.argv) > 2 else 200
# 起始現金（2026-11-23 正式站：1.07M／185k／35k／30k／10k／0）；wage=職階薪水；jobs=每天打工次數；on=每天上線機率
P = [dict(c=1070000,w=1650,jobs=10,on=.95,sp=3000,gam=.05), dict(c=185000,w=880,jobs=6,on=.8,sp=2200,gam=.02),
     dict(c=35000,w=570,jobs=4,on=.7,sp=1500,gam=0), dict(c=30000,w=385,jobs=3,on=.6,sp=1200,gam=0),
     dict(c=10000,w=290,jobs=2,on=.5,sp=900,gam=0), dict(c=0,w=210,jobs=1,on=.3,sp=500,gam=0)]
def tax(m):
    return int(max(0,min(m,1e5)-5e4)*.003+max(0,min(m,1e6)-1e5)*.008+max(0,min(m,5e6)-1e6)*.015+max(0,m-5e6)*.03)
def gini(x):
    x=sorted(x); n=len(x); s=sum(x)
    return 0 if s==0 else sum((2*i-n+1)*v for i,v in enumerate(x))/(n*s)
def run(sc, seed):
    random.seed(seed); cash=[p['c'] for p in P]; fund=63622; kt=kp=ks=1.0; hist=[]; prevM=sum(cash)/6
    for d in range(1,DAYS+1):
        act=[random.random()<p['on'] for p in P]
        for i,p in enumerate(P):
            if not act[i]: continue
            c=cash[i]
            if c<10000*ks: c+=600*ks
            c+=p['jobs']*p['w']*random.uniform(.85,1.1)                    # 打工
            if random.random()<.7: c+=2500                                  # 每日任務
            c+=random.choice([0,0,0,300,-300]) if c<1e4 else random.choice([0,0,0,.05*c,-.05*c]) # 登入隨機事件
            c-=[400,800,1500,3000][min(3,i//2+ (1 if i<2 else 0))]*.5 + p['sp']*kp  # 房租＋日常花費（價格倍率 kp）
            c-=p['gam']*c*.04                                                  # 賭場莊家優勢，錢消失
            c=max(0,c)
            t=int(tax(c)*kt); c-=t; fund+=t; cash[i]=c
        if sc>=4:                                                            # D 新出口：富人自願消費
            for i in range(6):
                ex=max(0,cash[i]-200000)*.003*act[i]; cash[i]-=ex; fund+=ex*.3   # 30% 進基金（拍賣／捐款），70% 銷毀
        if sc>=2 and d%7==0:                                                 # 鎮基金每週回流：花 70%，一半按「低於中位數 2 倍」補差發給活躍者，一半蓋建設（銷毀）
            pool=fund*.7; fund-=pool; med=st.median(cash)
            need=[max(0,2*med-c) if act[i] else 0 for i,c in enumerate(cash)]
            S=sum(need)
            if S>0:
                for i in range(6): cash[i]+=min(need[i],pool*.5*need[i]/S)
            fund+=pool*.5*(0)   # 另一半 pool 當公共建設／慶典花掉（銷毀）
        if sc>=3 and d%1==0:                                                 # 自動調節器（每日 ±2%，上下限 ±20%）
            M=sum(cash)/6; g=(M-prevM)/max(1,prevM) if d%7==0 else 0
            top=max(cash)/max(1,sum(cash)); poor=sum(c<10000 for c in cash)/6
            kt=min(1.2,max(.8,kt*(1.02 if top>.6 else .98 if top<.4 else 1)))
            if d%7==0:
                kp=min(1.2,max(.9,kp*(1.02 if g>.05 else .98 if g<-.02 else 1))); prevM=M
            ks=min(1.3,max(.8,ks*(1.02 if poor>.3 else .99)))
        if d in (30,90,DAYS): hist.append((d,sum(cash)/6,max(cash)/max(1,sum(cash)),gini(cash),st.median(cash),fund,kt,kp,ks))
    return hist
names={1:'A 現行基準',2:'B +基金週回流',3:'C +自動調節器',4:'D +富人新出口'}
for sc in (1,2,3,4):
    rs=[run(sc,s) for s in range(SEEDS)]
    print(names[sc])
    for k in range(3):
        v=[r[k] for r in rs]; f=lambda j: st.mean(x[j] for x in v)
        print(f"  第{v[0][0]:>3}天 人均現金{f(1):>9,.0f} 首富占比{f(2):.0%} 基尼{f(3):.2f} 中位數{f(4):>8,.0f} 基金{f(5):>8,.0f} k稅{f(6):.2f} k價{f(7):.2f} k補{f(8):.2f}")
