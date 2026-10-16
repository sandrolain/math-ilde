# 🎓 Math-ilde

**L'app educativa per imparare la matematica divertendoti!**

Math-ilde è una webapp Angular interattiva progettata per aiutare gli studenti della scuola primaria (6-11 anni) a padroneggiare le operazioni aritmetiche di base: **addizioni, sottrazioni, moltiplicazioni e divisioni**.

## ✨ Caratteristiche principali

### 🎯 Esercizi interattivi

- **Addizioni e sottrazioni**: Numeri fino a 1000, con opzione per 2 o 3 addendi
- **Moltiplicazioni**: Tabelline fino a 50×50, con rappresentazione visuale
- **Divisioni**: Divisioni senza resto con feedback immediato
- **3 livelli di difficoltà**: Facile, intermedio, difficile
- **Modalità mista**: Combina addizioni e sottrazioni casualmente
- **Scrittura a mano** (Sillabe → ✍️ Scrivi): verifica la lettera scritta a mano con
  modelli per stampatello/corsivo, maiuscolo/minuscolo; feedback su forma,
  dimensione, posizione e ordine/verso dei tratti, con stelline e messaggi in italiano

### 🎨 Interfaccia child-friendly

- **Design semplice e colorato**: Usa una palette di colori pastello rilassanti
- **Rappresentazione visuale**: Forme geometriche (cerchi, quadrati, stelle) per visualizzare i numeri
- **Feedback positivo**: Messaggi incoraggianti in caso di errore, celebrazioni per risposte corrette
- **Nessuna pressione temporale**: I bambini possono prendersi il tempo che serve

### 🎮 User Experience

- **Rappresentazione grafica intelligente**:
  - Addizioni: [o] + [oo] = 3 elementi
  - Sottrazioni: Elementi barrati per mostrare cosa viene tolto
  - Moltiplicazioni: Mostrate come somma di gruppi [oo] + [oo]
  - Divisioni: Elementi raggruppati senza operatore tra i gruppi
- **Focus management**: Il campo input riceve il focus automaticamente
- **Modal popup**: Feedback importante in finestre modali che catturano l'attenzione
- **Persistenza**: Le preferenze vengono salvate automaticamente

### 📱 Progressive Web App

- Installabile come app mobile (iOS, Android, Windows)
- Funziona offline (service worker)
- Adattivo e responsive (mobile-first design)
- Icone e shortcut native

## 🚀 Avvio rapido

### Per utenti

1. Apri [Math-ilde](https://math-ilde.example.com) nel browser
2. Seleziona il tipo di operazione (addizioni, moltiplicazioni, ecc.)
3. Regola il livello di difficoltà
4. Inizia a fare esercizi!
5. *Opzionale*: Installa come app dal menu del browser

### Per sviluppatori

#### Prerequisiti

- Node.js 20+
- npm

#### Installazione

```bash
git clone https://github.com/yourusername/math-ilde.git
cd math-ilde
npm install
```

#### Avvio in sviluppo

```bash
npm start
# oppure
ng serve
```

Visita `http://localhost:4200/`

#### Build per produzione

```bash
npm run build
# oppure
ng build --configuration production
```

Gli artifact saranno in `dist/math-ilde/`

#### Test

```bash
npm test
```

## 🏗️ Architettura tecnica

### Stack tecnologico

- **Framework**: Angular v20+ (standalone components)
- **Linguaggio**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + CSS custom properties
- **State Management**: Angular Signals
- **Persistenza**: localStorage
- **Build tool**: Angular CLI, Vite

### Struttura progetto

```
src/
├── app/
│   ├── components/          # Componenti riutilizzabili
│   │   ├── feedback/        # Sistema di feedback (modal, messaggi)
│   │   ├── header/          # Header con navigazione
│   │   ├── home/            # Menu principale
│   │   ├── options-control/ # Pannello opzioni (sidebar/mobile)
│   │   └── visual-representation/ # Visualizzazione forme
│   ├── pages/               # Pagine per sezione
│   │   ├── addition-subtraction/
│   │   ├── multiplication/
│   │   └── division/
│   ├── services/            # Business logic
│   │   ├── math-exercise.service.ts    # Generazione operazioni
│   │   ├── options-storage.service.ts  # Persistenza
│   │   └── feedback.service.ts         # Messaggi feedback
│   ├── types/               # Type definitions
│   └── app.routes.ts        # Routing con lazy loading
├── styles.css               # Design system globale
└── index.html               # HTML principale
```

### Algoritmi di generazione

#### Addizioni

- Genera addendi casuali rispettando il livello
- 2 o 3 addendi, risultato sempre entro il livello

#### Sottrazioni

- Minuendo sempre >= somma dei sottraendi
- Risultato sempre >= 0 (mai negativo)

#### Moltiplicazioni

- Fattori basati sul livello
- Rappresentate graficamente come somma di gruppi

#### Divisioni

- Sempre con risultato intero (nessun resto)
- Generate invertendo la moltiplicazione

## 🎯 Target audience

- **Studenti** della scuola primaria (6-11 anni)
- **Insegnanti** che cercano strumenti interattivi per la classe
- **Genitori** che vogliono supportare l'apprendimento a casa

## 📚 Requisiti educativi

✅ **WCAG AA accessibility** - Interfaccia accessibile
✅ **Focus management** - Navigazione chiara a tastiera
✅ **Screen reader friendly** - ARIA labels in italiano
✅ **Colori contrastati** - Anche con palette pastello
✅ **Touch-friendly** - Pulsanti min 44x44px
✅ **Senza tempo limite** - Nessuna pressione temporale
✅ **Feedback costruttivo** - Sempre incoraggiante

## 🔄 Aggiornamenti futuri

- [ ] Statistiche e progressi
- [ ] Sistema di ricompense/badge
- [ ] Suoni e animazioni avanzate
- [ ] Modalità sfida
- [ ] Supporto multi-lingua
- [ ] App nativa React Native

## 📝 Licenza

MIT

## 🤝 Contribuire

Le pull request sono benvenute! Per cambiamenti significativi, apri prima un issue per discutere le modifiche proposte.

## 📧 Contatti

Per domande o suggerimenti, apri un [issue](https://github.com/yourusername/math-ilde/issues)

---

Fatto con ❤️ per i bambini che amano la matematica

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
