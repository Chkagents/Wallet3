export default `
const observerRainbowKit = observeDOM(document.body, function(m){
    if (window.ethereum && window.ethereum._selectedAddress) {
        observerRainbowKit.disconnect();
        return;
    }

    let imageDives = document.querySelectorAll("button[data-testid='rk-wallet-option-metaMask'] div[role='img'] > div");
    if (imageDives) {
        for (let e of imageDives) {
            e.style.backgroundImage = "url('https://github.com/Wallet3/Wallet3/blob/main/assets/icon.png?raw=true')"
        }
    }
    
    let span = document.querySelector("button[data-testid='rk-wallet-option-metaMask'] div h2 span");
    if (span && span.textContent !== 'Wallet 3') {
        span.textContent = 'Wallet 3';
    }
});
`;
