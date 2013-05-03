function do_play_pause() {
    var player = $('audio').get(0);
    if(player.paused) {
        player.play();
    } else {
        player.pause();
    }
}

function do_next() {
    var player = $('audio').get(0);
}

function do_prev() {
    var player = $('audio').get(0);
}

function do_rewind() {
    var player = $('audio').get(0);
    player.currentTime = Math.max(player.currentTime - 5, 0);
}

function do_fforward() {
    var player = $('audio').get(0);
    player.currentTime = Math.min(player.currentTime + 5, player.duration);
}

chrome.commands.onCommand.addListener(function(command) {
    do_play_pause();
});

chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        console.log('Received: ' + request.action);
        if(request.action == 'play_pause') {
            do_play_pause();
        } else if(request.action == 'next') {
            do_next();
        } else if(request.action == 'prev') {
            do_next();
        } else if(request.action == 'rewind') {
            do_rewind();
        } else if(request.action == 'fforward') {
            do_fforward();
        }
    });
