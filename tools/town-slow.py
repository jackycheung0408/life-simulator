# 模擬 Fast 4G（延遲 150ms、下載 1.6Mbps ≈ 200KB/s）並像 GitHub Pages 一樣 gzip；用法：python3 slow.py 資料夾 埠
import sys,os,gzip,time,mimetypes
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
root=os.path.abspath(sys.argv[1]);port=int(sys.argv[2])
class H(BaseHTTPRequestHandler):
    def log_message(self,*a):pass
    def do_GET(self):
        path=self.path.split("?")[0].lstrip("/") or "index.html"
        f=os.path.join(root,path)
        if not os.path.isfile(f):
            self.send_response(404);self.end_headers();return
        data=open(f,"rb").read();t=mimetypes.guess_type(f)[0] or "application/octet-stream"
        gz=any(path.endswith(x) for x in (".html",".js",".json",".css"))
        if gz:data=gzip.compress(data,6)
        time.sleep(0.15)
        self.send_response(200);self.send_header("Content-Type",t+("; charset=utf-8" if t.startswith("text") or "javascript" in t else ""));self.send_header("Cache-Control","no-store")
        if gz:self.send_header("Content-Encoding","gzip")
        self.send_header("Content-Length",str(len(data)));self.end_headers()
        for i in range(0,len(data),4000):
            self.wfile.write(data[i:i+4000]);self.wfile.flush();time.sleep(4000/200000)
ThreadingHTTPServer(("127.0.0.1",port),H).serve_forever()
