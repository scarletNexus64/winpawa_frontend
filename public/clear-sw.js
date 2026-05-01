// Script to clear old service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister()
      console.log('✅ Service Worker unregistered')
    }
  })
}

// Clear all caches
caches.keys().then(function(names) {
  for (let name of names) {
    caches.delete(name)
    console.log('✅ Cache cleared:', name)
  }
})

console.log('🔄 Please refresh the page to reload the new service worker')
