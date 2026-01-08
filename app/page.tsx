import Link from 'next/link'
import { BookOpen, Map, Users, Heart, ArrowRight, Anchor } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F0] text-stone-900 font-sans selection:bg-indigo-100">

      {/* Navbar Minimalista */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="text-2xl font-serif font-black text-indigo-950 flex items-center gap-2">
          <Anchor className="text-amber-600 w-6 h-6" />
          KOINONIA
        </div>
        <div className="hidden md:flex gap-8 text-sm font-semibold text-stone-600">
          <a href="#proposito" className="hover:text-indigo-900 transition-colors">Propósito</a>
          <a href="#metodo" className="hover:text-indigo-900 transition-colors">O Método</a>
          <Link href="/transparencia" className="hover:text-indigo-900 transition-colors">Transparência</Link>
        </div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-full bg-indigo-950 text-white font-bold text-sm hover:bg-indigo-900 transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            Entrar na Tribo
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-5xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-block mb-4 px-4 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold tracking-widest uppercase">
          Discipulado Gamificado
        </div>
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-indigo-950 mb-8 leading-tight">
          A Bíblia não é apenas um livro.<br />
          <span className="text-amber-600 relative">
            É uma Jornada Viva.
            <svg className="absolute w-full h-3 -bottom-1 left-0 text-amber-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
            </svg>
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-stone-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Redescubra as Escrituras através de um sistema que une a profundidade teológica com o engajamento moderno.
        </p>

        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <Link
            href="/login"
            className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
          >
            Iniciar Minha Peregrinação <ArrowRight size={20} />
          </Link>
          <a
            href="#como-funciona"
            className="px-8 py-4 bg-white text-stone-600 border border-stone-200 rounded-xl font-bold text-lg hover:bg-stone-50 transition-all"
          >
            Como funciona?
          </a>
        </div>
      </header>

      {/* Features Grid */}
      <section className="bg-white py-20 border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Map}
              title="A Teia do Conhecimento"
              description="Visualize conexões profundas entre Antigo e Novo Testamento. Veja como profecias se cumprem visualmente."
            />
            <FeatureCard
              icon={Users}
              title="Tribos & Discipulado"
              description="Não caminhe sozinho. Junte-se a uma tribo, tenha mentores e acompanhe o crescimento espiritual de seus discípulos."
            />
            <FeatureCard
              icon={BookOpen}
              title="Leitura Híbrida Inteligente"
              description="Funciona offline. Dicionário teológico integrado com IA que explica termos complexos sem sair da página."
            />
          </div>
        </div>
      </section>

      {/* Gamification Explanation */}
      <section className="py-20 bg-stone-900 text-stone-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <h2 className="text-4xl font-serif font-bold text-white">Gamificação Sagrada</h2>
            <p className="text-lg text-stone-400">
              Substituímos termos de jogos seculares por uma linguagem do Reino, criando uma experiência imersiva e reverente.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <GameTerm secular="XP" kingdom="Talentos" />
              <GameTerm secular="Level" kingdom="Estatura" />
              <GameTerm secular="Clan" kingdom="Tribo" />
              <GameTerm secular="Streak" kingdom="Constância" />
            </div>
          </div>
          <div className="flex-1">
            {/* Visual Placeholder for App Interface */}
            <div className="bg-stone-800 rounded-2xl p-4 border border-stone-700 shadow-2xl skew-y-3 rotate-2 hover:rotate-0 transition-all duration-700">
              <div className="bg-stone-900 rounded-xl p-6 h-80 flex items-center justify-center text-stone-600 font-mono text-sm">
                [Interface do App: Dashboard do Peregrino]
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 text-stone-500 py-12 border-t border-stone-900">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm">
            © 2024 Koinonia Project. Open Source.
          </div>
          <div className="flex gap-6">
            <Link href="/transparencia" className="hover:text-amber-500 transition-colors flex items-center gap-2">
              <Heart size={16} /> Transparência
            </Link>
            <a href="https://github.com/seu-repo" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: any) {
  return (
    <div className="p-8 rounded-2xl bg-stone-50 border border-stone-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50/50 transition-all cursor-default group">
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-900 mb-6 shadow-sm group-hover:scale-110 transition-transform">
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold text-indigo-950 mb-3">{title}</h3>
      <p className="text-stone-500 leading-relaxed">
        {description}
      </p>
    </div>
  )
}

function GameTerm({ secular, kingdom }: any) {
  return (
    <div className="flex items-center justify-between bg-stone-800/50 p-4 rounded-lg border border-stone-700/50">
      <span className="text-stone-500 text-sm line-through">{secular}</span>
      <ArrowRight size={14} className="text-stone-600" />
      <span className="text-amber-400 font-bold">{kingdom}</span>
    </div>
  )
}
