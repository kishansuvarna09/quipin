alert("Reddit content script loaded");

const observer = new MutationObserver(() => {
    const postElements = document.querySelectorAll('shreddit-post');

    console.log('postElement', postElements)

    if(!postElements) {
        return null;
    }
})

observer.observe(document.body, { childList: true, subtree: true });