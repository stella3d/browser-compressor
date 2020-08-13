const browserRef = chrome ? chrome : browser;
const topKey = 'audioDynCompressor';

function save(options, done) { 
    browserRef.storage.local.set({ topKey : options }, done); 
}

function load(defaults, done) {
    browserRef.storage.local.get({ topKey : {} }, done);
}

const themeCheck = document.getElementById('theme');

const themeKey= 'lightTheme';
load({ themeKey : false }, (loadedOptions) => {
    if(!loadedOptions) 
        return;
    
    themeCheck.value = loadedOptions[themeKey];
    themeCheck.onchange = () => save({themeKey  : themeCheck.value });

    console.log('options onload of prefs complete', loadedOptions);
});
