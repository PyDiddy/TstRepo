var output = "Variabili Globali Trovate:\n";
for (var key in this) {
    if (this.hasOwnProperty(key)) {
        // Evitiamo di stampare l'intero codice delle funzioni, prendiamo solo il nome
        var valType = typeof this[key];
        output += "- " + key + " (" + valType + ")\n";
    }
}
console.log(output);
