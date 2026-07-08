// ==========================================
// CYANIDE INSPECTOR (FLEX-JS PROTOTYPE)
// ==========================================

function startInspector() {
    console.log("[INSPECTOR] Inizializzazione...");

    var UIScreen = ObjC.classes.UIScreen;
    var UIWindow = ObjC.classes.UIWindow;
    var UIColor = ObjC.classes.UIColor;
    var UIApplication = ObjC.classes.UIApplication;

    // 1. Creiamo "Il Vetro" a tutto schermo
    var bounds = UIScreen.mainScreen().bounds();
    var glassWindow = UIWindow.alloc().initWithFrame_(bounds);
    
    // Lo mettiamo altissimo, sopra anche alle allerte di sistema
    glassWindow.setWindowLevel_(100000); 
    
    // Lo coloriamo di un blu quasi trasparente per capire che l'Inspector è attivo
    glassWindow.setBackgroundColor_(UIColor.colorWithRed_green_blue_alpha_(0.0, 0.5, 1.0, 0.2));
    glassWindow.makeKeyAndVisible();

    console.log("[INSPECTOR] Vetro posizionato. Livello Window: " + glassWindow.windowLevel());

    // 2. Il trucco dell'Hit-Testing (Magia Pura)
    // Poiché aggiungere un UITapGestureRecognizer in un bridge JS base richiede la creazione
    // di blocchi e classi delegate, usiamo una tecnica più hacker: facciamo l'override del
    // metodo 'hitTest:withEvent:' direttamente sul nostro vetro!

    // Salviamo l'implementazione originale se serve, ma qui facciamo una cosa furba:
    // Quando il Vetro riceve il tocco, calcola LEI stessa cosa c'è sotto.
    
    var UIWindow_hitTest = ObjC.classes.UIWindow['- hitTest:withEvent:'];
    
    Interceptor.attach(UIWindow_hitTest.implementation, {
        onEnter: function(args) {
            this.self = new ObjC.Object(args[0]);
            this.point = args[2]; // CGPoint passato come struttura
        },
        onLeave: function(retval) {
            // Se l'hitTest stava avvenendo sul nostro Vetro...
            if (this.self.handle() === glassWindow.handle()) {
                // Non vogliamo che il vetro blocchi il tocco, vogliamo che faccia da "scanner".
                // Troviamo la finestra principale della SpringBoard
                var app = UIApplication.sharedApplication();
                var keyWindow = app.keyWindow();
                
                if (keyWindow) {
                    // Chiediamo a iOS: "Chi c'è sotto questo punto nella VERA finestra?"
                    var viewToccata = keyWindow.hitTest_withEvent_(this.point, null);
                    
                    if (viewToccata && viewToccata.handle() !== 0x0) {
                        var className = viewToccata.$className;
                        console.log("\n[!] BERSAGLIO ACQUISITO [!]");
                        console.log("Classe: " + className);
                        console.log("Indirizzo: " + viewToccata.handle());
                        
                        // 3. I SUPERPOTERI: Evidenziamo la vista!
                        var layer = viewToccata.layer();
                        layer.setBorderWidth_(4.0);
                        layer.setBorderColor_(UIColor.redColor().CGColor());
                        
                        // Facciamo lampeggiare l'alpha per feedback visivo
                        viewToccata.setAlpha_(0.5);
                        setTimeout(function() {
                            viewToccata.setAlpha_(1.0);
                        }, 200);
                        
                        // Se è una Label, potremmo anche cambiarne il testo!
                        if (viewToccata.isKindOfClass_(ObjC.classes.UILabel.class())) {
                            console.log("È una UILabel! Testo attuale: " + viewToccata.text());
                            // viewToccata.setText_("Hacked");
                        }
                    }
                }
                
                // Restituiamo NULL al sistema operativo. 
                // Questo fa sì che il vetro non "mangi" il tocco, permettendo
                // alla SpringBoard di continuare a funzionare normalmente sotto!
                retval.replace(ptr("0x0")); 
            }
        }
    });

    console.log("[INSPECTOR] Pronto! Tocca un qualsiasi elemento sullo schermo.");
    
    // Per disattivarlo: glassWindow.setHidden_(true);
    return glassWindow;
}

// Avvia l'ispezione
var inspectorGlass = startInspector();
