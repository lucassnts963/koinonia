import Link from 'next/link'
import { BookOpen, Map, Users, Heart, ArrowRight, Network, Scroll, Compass } from 'lucide-react'
import KoinoniaLogo from '@/components/brand/KoinoniaLogo'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-amber-100">

      {/* Navbar Minimalista */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-3">
          <KoinoniaLogo className="w-8 h-8 text-amber-600" />
          <div>
            <span className="text-xl font-serif font-bold text-stone-900 tracking-tight block leading-none">KOINONIA</span>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">Discipulado</span>
          </div>
        </div>

        <div className="hidden md:flex gap-8 text-sm font-semibold text-stone-500">
          <a href="#proposito" className="hover:text-amber-700 transition-colors">Propósito</a>
          <a href="#funcionalidades" className="hover:text-amber-700 transition-colors">Ferramentas</a>
          <Link href="/transparencia" className="hover:text-amber-700 transition-colors">Transparência</Link>
        </div>

        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-sm hover:bg-black transition-all shadow-lg shadow-stone-900/10 hover:shadow-xl hover:-translate-y-0.5"
          >
            Acessar Tenda
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-32 text-center relative">
        {/* Background Decorativo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-amber-50/50 to-transparent -z-10 rounded-full blur-3xl opacity-60"></div>

        <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-white border border-stone-200 text-stone-600 rounded-full text-xs font-bold tracking-widest uppercase shadow-sm">
          <Compass size={14} className="text-amber-600" />
          Uma Nova Jornada
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black text-stone-900 mb-8 leading-[0.95] tracking-tight">
          A Bíblia Viva,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-800 relative">
            Conectada.
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-stone-500 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
          Uma plataforma de estudos que une a <strong className="text-stone-700 font-medium">profundidade teológica</strong> com a tecnologia de grafos e gamificação reverente.
        </p>

        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <Link
            href="/login"
            className="px-8 py-4 bg-amber-600 text-white rounded-2xl font-bold text-lg flex items-center gap-2 hover:bg-amber-700 transition-all shadow-xl shadow-amber-600/20 group"
          >
            Iniciar Minha Peregrinação
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#funcionalidades"
            className="px-8 py-4 bg-white text-stone-600 border border-stone-200 rounded-2xl font-bold text-lg hover:bg-stone-50 transition-all hover:border-stone-300"
          >
            Conhecer o Método
          </a>
        </div>
      </header>

      {/* Features Grid */}
      <section id="funcionalidades" className="bg-white py-24 border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold text-stone-900 mb-4">Ferramentas para o Reino</h2>
            <p className="text-stone-500 max-w-2xl mx-auto">Tudo que você precisa para aprofundar seu relacionamento com as Escrituras.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Network}
              title="A Teia (Grafo)"
              description="Visualize as conexões entre versículos, temas e seus estudos pessoais. Veja como o Antigo Testamento aponta para o Novo em um mapa vivo."
            />
            <FeatureCard
              icon={Map}
              title="Jornada Gamificada"
              description="Um plano de leitura anual visual. Acompanhe seu progresso dia a dia em um mapa estilo 'Duolingo', mas focado exclusivamente na Bíblia."
            />
            <FeatureCard
              icon={Scroll}
              title="Estúdio Exegético"
              description="Editor de texto focado, com barra lateral de busca bíblica e inserção rápida de versículos que gera conexões automáticas na sua Teia."
            />
          </div>
        </div>
      </section>

      {/* Gamification Explanation */}
      <section className="py-24 bg-stone-950 text-stone-200 relative overflow-hidden">
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 space-y-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Gamificação Sagrada</h2>
              <div className="h-1 w-20 bg-amber-600 rounded-full"></div>
            </div>

            <p className="text-xl text-stone-400 leading-relaxed font-light">
              Substituímos a lógica viciante dos jogos seculares por um sistema que incentiva a constância e a profundidade. Em vez de competir, você colabora. Em vez de "power-ups", recebe dons espirituais simbólicos.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <GameTerm secular="XP (Experiência)" kingdom="Talentos" />
              <GameTerm secular="Level (Nível)" kingdom="Estatura" />
              <GameTerm secular="Clan / Guild" kingdom="Tribo" />
              <GameTerm secular="Streak (Sequência)" kingdom="Constância" />
            </div>
          </div>

          <div className="flex-1 w-full relative">
            {/* Abstract UI Representation */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>

            <div className="relative bg-stone-900/50 backdrop-blur-sm border border-stone-800 p-8 rounded-3xl shadow-2xl">
              <div className="flex items-center gap-4 mb-6 border-b border-stone-800 pb-4">
                <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center border border-amber-600/50 text-amber-500 font-bold">
                  XII
                </div>
                <div>
                  <div className="text-sm text-stone-400 uppercase tracking-widest font-bold">Estatura</div>
                  <div className="text-xl text-white font-serif">Discípulo Maduro</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-700 to-amber-500 w-[75%]"></div>
                </div>
                <div className="flex justify-between text-xs text-stone-500 font-mono">
                  <span>TALENTOS: 4,250</span>
                  <span>PRÓXIMO: OBREIRO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-stone-500 py-12 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm flex items-center gap-2">
            <span className="font-bold text-stone-900">Koinonia Project</span> • Open Source
          </div>
          <div className="flex gap-8 text-sm font-medium">
            <Link href="/transparencia" className="hover:text-amber-600 transition-colors flex items-center gap-2">
              <Heart size={16} /> Transparência Financeira
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: any) {
  return (
    <div className="p-8 rounded-3xl bg-stone-50 border border-stone-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all cursor-default group">
      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-stone-900 mb-6 shadow-sm border border-stone-100 group-hover:scale-110 group-hover:border-amber-200 transition-all">
        <Icon size={28} className="text-amber-600" />
      </div>
      <h3 className="text-2xl font-serif font-bold text-stone-900 mb-3">{title}</h3>
      <p className="text-stone-500 leading-relaxed">
        {description}
      </p>
    </div>
  )
}

function GameTerm({ secular, kingdom }: any) {
  return (
    <div className="flex items-center justify-between bg-stone-900 p-4 rounded-xl border border-stone-800 hover:border-amber-900/50 transition-colors group">
      <span className="text-stone-600 text-xs font-mono uppercase tracking-wider group-hover:text-stone-500 transition-colors">{secular}</span>
      <ArrowRight size={14} className="text-stone-700" />
      <span className="text-amber-500 font-bold font-serif tracking-wide">{kingdom}</span>
    </div>
  )
}
