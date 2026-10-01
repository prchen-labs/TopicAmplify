import socket, pickle
from threading import Thread

class MultiProcessSocket:
    def __init__(self,func,DataSet):
        self.func = func
        self.DataSet = DataSet
        self.server = self._server(self)
        
    def start(self):
        self.host = self.server.setup()
        Thread(target = self.server.start, args=(self.func,)).start()
    
    def call(self,args):
        client = self._client(self)
        client.call_func(args)       
            
    def get_data(self):
        print(id(self.DataSet))
        return self.DataSet
    
    def close(self):
        self.server.close()
        
    class _server:
        def __init__(self,outer,buf_size=1048576):
            self.outer = outer        
            self.buf_size = buf_size  
            
        def setup(self,port=0):
            self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server.bind(('', port))
            self.server.listen(30)
            return self.server.getsockname()
        
        def start(self,func): 
            while True:
                conn, addr = self.server.accept()
                args = conn.recv(self.buf_size)   
                if(args == b'shutdown'):
                    break
                else: 
                    try:
                        connection = {
                            'args' : pickle.loads(args),
                            'conn' : conn,
                            'addr' : addr,
                        }
                        Thread(target = self.run_func, args=(func, connection,)).start()
                        
                    except Exception as e:
                        print(e)
            print("server closed")
            self.server.close()
        def run_func(self, func, connection):
            func(self.outer.DataSet,connection['args'])
            connection['conn'].close()            
            
        def close(self):
            conn = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            conn.connect(self.outer.host)
            conn.send(b'shutdown')
            conn.close()
            
    class _client:
        def __init__(self,outer):
            self.outer = outer
            
        def call_func(self,args):
            self.conn = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.conn.connect(self.outer.host)
            self.conn.send(pickle.dumps(args))
            self.conn.close()