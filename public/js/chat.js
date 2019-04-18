const socket = io()

//Elements
const $form = document.querySelector('#form')
const $formInput = $form.querySelector('#msg')
const $formButton = $form.querySelector('#send')

const $shareButton = document.querySelector('#sendLocation')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options 
const { username, room } = Qs.parse(location.search,{ignoreQueryPrefix:true})
console.log({username,room})

const autoscroll = () => {
    // new message
    $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight

    //get Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled
    const scrollOffSet = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffSet) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message,username) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        message:message.text,
        createdAt:moment(message.createdAt).format('HH:mm A'),
        username
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationInfo', (locationURL,username) => {
    console.log(locationURL)
    const html = Mustache.render(locationTemplate, {
        locationURL:locationURL.url,
        createdAt:moment(locationURL.createdAt).format('HH:mm A'),
        username
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
},(cbDelivery => {
    console.log(cbDelivery)
}))

socket.on('roomData', ({room,users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    $sidebar.innerHTML = html

})

$form.addEventListener('submit', (e) => {
    //Disable form until msg sent
    e.preventDefault()
    $formButton.setAttribute('disabled','disabled')
    socket.emit('uMsg',$formInput.value, (error) => {
        //acknowledgement form enable
        $formButton.removeAttribute('disabled')
        $formInput.focus()

        if (error) return alert(error)

        console.log('Message delivered')
    })

    $formInput.value = ''
})

$shareButton.addEventListener('click', e => {
    if(!navigator.geolocation) return alert('Operation not supperted by your browser')

    $shareButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition(position => {
        socket.emit('sendLocation', {
            lat:position.coords.latitude,
            long:position.coords.longitude
        }, (message) => {
            $shareButton.removeAttribute('disabled')
            console.log(message)
        })
    })
})

socket.emit('join',{username, room}, error => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})