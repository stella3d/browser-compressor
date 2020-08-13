const browserRef = chrome ? chrome : browser;
const topKey = 'audioCompressor';

function save(options, done) { 
    browserRef.storage.local.set({ topKey : options }, done); 
}

function load(defaults, done) {
    browserRef.storage.local.get({ topKey : {} }, done);
}


const themeCheck = document.getElementById('theme');
themeCheck.onchange = () => save({ 'theme' : themeCheck.value ? 'light' : 'dark' });
