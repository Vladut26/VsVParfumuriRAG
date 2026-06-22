import { type FC } from "react";
import { Link } from "react-router-dom";
import MainHeader from "../components/MainHeader";
import MainFooter from "../components/MainFooter";

const VALUES = [
  { icon: "M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z",
    title: "Autenticitate", desc: "Fiecare parfum din catalogul nostru este original, provenit direct de la brandurile de lux pe care le reprezentam." },
  { icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    title: "Inovatie AI", desc: "Folosim inteligenta artificiala pentru a-ti oferi recomandari personalizate si analiza automata a recenziilor." },
  { icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    title: "Pasiune", desc: "Suntem pasionati de parfumuri si credem ca fiecare persoana merita sa gaseasca esenta care o defineste." },
  { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    title: "Securitate", desc: "Platile tale sunt procesate prin Stripe, cu criptare de nivel bancar si conformitate PCI-DSS." },
];

const STATS = [
  { value: "200+", label: "Parfumuri" },
  { value: "10+", label: "Branduri Premium" },
  { value: "AI", label: "Recomandari Inteligente" },
  { value: "24/7", label: "Consultant Virtual" },
];

const AboutPage: FC = () => (
  <div className="flex flex-col min-h-screen bg-[var(--cream)]">
    <MainHeader />

    {/* Hero */}
    <section className="relative overflow-hidden bg-[var(--noir)] text-white py-20 md:py-28">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--noir)] via-[var(--noir)]/95 to-[var(--gold-dark)]/10" />
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="w-12 h-[2px] bg-[var(--gold)] mx-auto mb-6 opacity-60" />
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 tracking-tight">
          Povestea <span className="text-[var(--gold)]">VsV Parfumuri</span>
        </h1>
        <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed font-light">
          O platforma care redefineste experienta de cumparare a parfumurilor prin inteligenta artificiala si design centrat pe utilizator.
        </p>
      </div>
    </section>

    {/* Stats */}
    <section className="max-w-5xl mx-auto px-6 -mt-10 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100">
            <p className="text-2xl md:text-3xl font-serif font-bold text-[var(--gold-dark)] mb-1">{s.value}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Mission */}
    <section className="max-w-4xl mx-auto px-6 py-16 md:py-20">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold-dark)] font-semibold mb-3">Misiunea noastra</h2>
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-[var(--noir)] mb-4 leading-tight">
            Sa facem descoperirea parfumului perfect o experienta personala si inteligenta
          </h3>
          <p className="text-gray-500 leading-relaxed mb-4">
            VsV Parfumuri a fost creata din convingerea ca alegerea unui parfum nu ar trebui sa fie un proces aleatoriu. 
            Am integrat inteligenta artificiala la fiecare nivel al experientei de cumparare — de la chatbot-ul 
            conversational care intelege preferintele tale olfactive, pana la analiza automata a sentimentului 
            recenziilor care iti ofera o perspectiva imediata asupra opiniei colective.
          </p>
          <p className="text-gray-500 leading-relaxed">
            Platforma noastra utilizeaza Google Gemini pentru recomandari personalizate si un model RoBERTa 
            specializat pentru clasificarea sentimentului, oferind o experienta de cumparare care anticipeaza 
            viitorul comertului electronic.
          </p>
        </div>
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[var(--gold-dark)] text-lg">1</span>
              </div>
              <div>
                <p className="font-semibold text-[var(--noir)] text-sm mb-1">Intreaba asistentul AI</p>
                <p className="text-xs text-gray-400">Descrie-i ce cauti in limbaj natural</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[var(--gold-dark)] text-lg">2</span>
              </div>
              <div>
                <p className="font-semibold text-[var(--noir)] text-sm mb-1">Primeste recomandari</p>
                <p className="text-xs text-gray-400">AI-ul analizeaza catalogul si recenziile</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[var(--gold-dark)] text-lg">3</span>
              </div>
              <div>
                <p className="font-semibold text-[var(--noir)] text-sm mb-1">Descopera parfumul perfect</p>
                <p className="text-xs text-gray-400">Adauga in cos direct din chat</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold-dark)] font-semibold mb-3">Valorile noastre</h2>
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-[var(--noir)]">Ce ne diferentiaza</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map((v) => (
            <div key={v.title} className="p-6 rounded-2xl border border-gray-100 hover:border-[var(--gold)]/20
                                          hover:shadow-lg hover:shadow-[var(--gold)]/5 transition-all text-center group">
              <div className="w-12 h-12 rounded-xl bg-[var(--cream)] flex items-center justify-center mx-auto mb-4
                              group-hover:bg-[var(--gold)]/10 transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={v.icon} />
                </svg>
              </div>
              <h4 className="font-semibold text-[var(--noir)] mb-2">{v.title}</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="max-w-4xl mx-auto px-6 py-16 text-center">
      <h3 className="text-2xl font-serif font-bold text-[var(--noir)] mb-4">Pregatit sa descoperi?</h3>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">Exploreaza catalogul nostru sau intreaba direct asistentul AI.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/" className="btn-luxury px-8 py-3 rounded-xl text-sm uppercase tracking-wider">
          Exploreaza Catalogul
        </Link>
        <Link to="/contact" className="px-8 py-3 rounded-xl text-sm uppercase tracking-wider border border-[var(--gold)]/20
                                        text-[var(--gold-dark)] hover:bg-[var(--gold)]/5 transition-colors">
          Contacteaza-ne
        </Link>
      </div>
    </section>

    <MainFooter />
  </div>
);

export default AboutPage;