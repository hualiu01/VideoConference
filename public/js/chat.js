'use strict';

$(function(){
///////////////////////////////////////////////////////////////////// chat
	var socket = io.connect();
	var $messageForm = $('#messageForm');
	var $message = $('#message');
	var $chat = $('#chat');
	var $users = $('#users');

	var $roomid = $('#roomid').text();
	var $username = prompt('Please enter your name','name');
    if ($username != null && $username != "") {
        var newUsrInfo = {
        	'username': $username,
        	'roomid': $roomid
        };
        socket.emit('new user', newUsrInfo);
    }
    socket.on('new user added', function(data){
    	$chat.append('<div class="well msg-info">'+data['name']+' joined the room!</div>');
    	var roomMembers = data['userSet'];
    	$users.empty();
    	roomMembers.forEach(function(username){
    		$users.append('<li>'+username+'</li>')
    	});
    });
    socket.on('user left', function(data){
    	$chat.append('<div class="well msg-info">'+data['name']+' left the room!</div>');
    	var roomMembers = data['userSet'];
    	$users.empty();
    	roomMembers.forEach(function(username){
    		$users.append('<li>'+username+'</li>')
    	});
    });

	$messageForm.submit(function(e){
		e.preventDefault();
		console.log('submitted');
		socket.emit('send message', $message.val());
		$message.val('');
	});

	// socket.on('connect', function(){});

	socket.on('new message', function(data){
		console.log('send message detected in chat.js: ' + data.msg);
		$chat.append('<div class="well msg">'+data.user+': '+data.msg+'</div>')
	});


    var $startpoll = $('#startpoll');
    var $pollform = $('#pollForm');
    var $pollingPesult = $('#pollingPesult');
    $startpoll.on('click',function(){
        socket.emit('startpolling');
    });
	$pollform.submit(function(e){
        e.preventDefault();
		console.log('poll submitted');
        var polls = $pollform[0];
        var abcd = "";
        var i;
        for(i=0;i<polls.length; i++){
            if(polls[i].checked) {
                abcd = polls[i].value;
                break;
            }
        }

        console.log(abcd);
		$("#pollSubmit").attr("disabled", true);
        socket.emit('abcd', abcd);
	});
    socket.on('startnewpoll', function(){
        console.log("start a new poll!");
        $("#pollSubmit").attr("disabled", false);
    });

    socket.on('poll update', function(data){
        console.log("poll updata received");
        $pollingPesult.empty();
        $pollingPesult.append('<li> A: '+data.a+'</li>');
        $pollingPesult.append('<li> B: '+data.b+'</li>');
        $pollingPesult.append('<li> C: '+data.c+'</li>');
        $pollingPesult.append('<li> D: '+data.d+'</li>');

    })

////////////////////////////////////////////////////////////////////////////////////////vedio
    var room = $roomid;

    // create our webrtc connection
    var webrtc = new SimpleWebRTC({
        // the id/element dom element that will hold "our" video
        localVideoEl: 'localVideo',
        // the id/element dom element that will hold remote videos
        remoteVideosEl: '',
        // immediately ask for camera access
        autoRequestMedia: true,
        debug: false,
        detectSpeakingEvents: true,
        autoAdjustMic: false
    });

    // when it's ready, join 
    webrtc.on('readyToCall', function () {
        // you can name it anything
        if (room) webrtc.joinRoom(room);
    });

    function showVolume(el, volume) {
        if (!el) return;
        if (volume < -45) volume = -45; // -45 to -20 is
        if (volume > -20) volume = -20; // a good range
        el.value = volume;
    }

    // we got access to the camera
    webrtc.on('localStream', function (stream) {
        $('#localVolume').show();
    });
    // we did not get access to the camera
    webrtc.on('localMediaError', function (err) {
    });

    //a peer video has been added
    webrtc.on('videoAdded', function (video, peer) {
        console.log('video added', peer);
        var remotes = document.getElementById('remotes');
        if (remotes) {
            var container = document.createElement('div');
            container.className = 'videoContainer';
            container.id = 'container_' + webrtc.getDomId(peer);
            container.appendChild(video);

            // suppress contextmenu
            video.oncontextmenu = function () { return false; };

            // resize the video on click
            video.onclick = function () {
                container.style.width = video.videoWidth + 'px';
                container.style.height = video.videoHeight + 'px';
            };

            // show the remote volume
            var vol = document.createElement('meter');
            vol.id = 'volume_' + peer.id;
            vol.className = 'volume';
            vol.min = -45;
            vol.max = -20;
            vol.low = -40;
            vol.high = -25;
            container.appendChild(vol);

            // show the ice connection state
            if (peer && peer.pc) {
                var connstate = document.createElement('div');
                connstate.className = 'connectionstate';
                container.appendChild(connstate);
                peer.pc.on('iceConnectionStateChange', function (event) {
                    switch (peer.pc.iceConnectionState) {
                    case 'checking':
                        connstate.innerText = 'Connecting to peer...';
                        break;
                    case 'connected':
                    case 'completed': // on caller side
                        $(vol).show();
                        connstate.innerText = 'Connection established.';
                        break;
                    case 'disconnected':
                        connstate.innerText = 'Disconnected.';
                        break;
                    case 'failed':
                        connstate.innerText = 'Connection failed.';
                        break;
                    case 'closed':
                        connstate.innerText = 'Connection closed.';
                        break;
                    }
                });
            }
            remotes.appendChild(container);
        }
    });
    // a peer was removed
    webrtc.on('videoRemoved', function (video, peer) {
        console.log('video removed ', peer);
        var remotes = document.getElementById('remotes');
        var el = document.getElementById(peer ? 'container_' + webrtc.getDomId(peer) : 'localScreenContainer');
        if (remotes && el) {
            remotes.removeChild(el);
        }
    });

    // local volume has changed
    webrtc.on('volumeChange', function (volume, treshold) {
        showVolume(document.getElementById('localVolume'), volume);
    });
    // remote volume has changed
    webrtc.on('remoteVolumeChange', function (peer, volume) {
        showVolume(document.getElementById('volume_' + peer.id), volume);
    });

    // local p2p/ice failure
    webrtc.on('iceFailed', function (peer) {
        var connstate = document.querySelector('#container_' + webrtc.getDomId(peer) + ' .connectionstate');
        console.log('local fail', connstate);
        if (connstate) {
            connstate.innerText = 'Connection failed.';
            // fileinput.disabled = 'disabled';
        }
    });

    // remote p2p/ice failure
    webrtc.on('connectivityError', function (peer) {
        var connstate = document.querySelector('#container_' + webrtc.getDomId(peer) + ' .connectionstate');
        console.log('remote fail', connstate);
        if (connstate) {
            connstate.innerText = 'Connection failed.';
            // fileinput.disabled = 'disabled';
        }
    });

    function setRoom(name) {
        $('body').addClass('active');
    }

    if (room) {
        setRoom(room);
    } 
});