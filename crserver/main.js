function TcpServer(addr, port) {
    this.addr = addr;
    this.port = port;
    this.socketId = null;

    this.clientSocketId = null;
}

TcpServer.prototype.listen = function() {
    chrome.socket.create('tcp', {}, this._createDone.bind(this));
};


TcpServer.prototype._createDone = function(createInfo) {
    this.socketId = createInfo.socketId;
    chrome.socket.listen(this.socketId, this.addr, this.port, null, this._listenDone.bind(this));
}

TcpServer.prototype._listenDone = function(result) {
    chrome.socket.accept(this.socketId, this._acceptDone.bind(this));
}

TcpServer.prototype._acceptDone = function(acceptInfo) {
    this.clientSocketId = acceptInfo.socketId;
    chrome.socket.read(this.clientSocketId, null, this._dataRead.bind(this));
}

TcpServer.prototype._dataRead = function(readInfo) {
    if(readInfo && readInfo.resultCode > 0) {
        var data = String.fromCharCode.apply(null, new Uint8Array(readInfo.data));
        data = data.replace(/^\s+/, '').replace(/\s+$/, '');
        console.log(data);
        chrome.runtime.sendMessage('gobiodffbhpihkhokanncjkeeijiinbg', {'action': data});
        chrome.socket.disconnect(this.clientSocketId);
        chrome.socket.accept(this.socketId, this._acceptDone.bind(this));
    }
    chrome.socket.read(this.clientSocketId, null, this._dataRead.bind(this));
}

chrome.app.runtime.onLaunched.addListener(function() {
    var server = new TcpServer('127.0.0.1', 8080);
    server.listen();
    /*
    chrome.socket.create('tcp', {}, function(createInfo) {
        var socketId = createInfo.socketId;
        chrome.socket.listen(socketId, 'localhost', 8080, null, function(result) {
            chrome.socket.accept(socketId);
        });
    });*/
/*
  // Center window on screen.
  var screenWidth = screen.availWidth;
  var screenHeight = screen.availHeight;
  var width = 500;
  var height = 300;

  chrome.app.window.create('index.html', {
    bounds: {
      width: width,
      height: height,
      left: Math.round((screenWidth-width)/2),
      top: Math.round((screenHeight-height)/2)
    }
  });*/
});
