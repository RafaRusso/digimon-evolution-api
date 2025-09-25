import { useState, useEffect } from 'react'
import { Search, ArrowRight, ArrowLeft, Info, Zap, ImageIcon, Grid3X3, TreePine, List, ChevronRight, ChevronDown, Star, Zap as Lightning, X } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import digimonData from './assets/digimon_data.json'
import pageBg from './assets/design/page_bg_raw.jpg'
import heroImg from './assets/design/library_hero.jpg'
import './App.css'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDigimon, setSelectedDigimon] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [evolutionData, setEvolutionData] = useState(null)
  const [currentView, setCurrentView] = useState('search') // 'search', 'list', 'evolution'
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    setEvolutionData(digimonData)
  }, [])

  useEffect(() => {
    if (searchQuery.trim() && evolutionData) {
      const query = searchQuery.toLowerCase()
      const results = Object.values(evolutionData.digimons)
        .filter(digimon => digimon.name.toLowerCase().includes(query))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 10)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, evolutionData])

  // Função para obter requisitos de um Digimon específico
  const getDigimonRequirements = (digimonName) => {
    return evolutionData?.digimon_requirements?.[digimonName] || null
  }

  const getEvolutionLine = (digimonName) => {
    if (!evolutionData) return null

    const digimon = evolutionData.digimons[digimonName]
    if (!digimon) return null

    const result = {
      digimon: digimon,
      evolves_to: [],
      evolves_from: [],
      complete_line: {
        predecessors: [],
        successors: []
      }
    }

    // Evoluções diretas com requisitos do Digimon de destino
    if (evolutionData.evolutions[digimonName]) {
      result.evolves_to = evolutionData.evolutions[digimonName]
        .map(name => {
          const evoDigimon = evolutionData.digimons[name]
          if (!evoDigimon) return null
          
          // Buscar requisitos do Digimon de destino
          const requirements = getDigimonRequirements(name)
          return {
            ...evoDigimon,
            requirements: requirements
          }
        })
        .filter(Boolean)
    }

    // Pré-evoluções diretas
    if (evolutionData.pre_evolutions[digimonName]) {
      result.evolves_from = evolutionData.pre_evolutions[digimonName]
        .map(name => evolutionData.digimons[name])
        .filter(Boolean)
    }

    // Linha evolutiva completa (recursiva)
    const getAllPredecessors = (name, visited = new Set()) => {
      if (visited.has(name)) return []
      visited.add(name)
      
      let predecessors = []
      if (evolutionData.pre_evolutions[name]) {
        for (const preName of evolutionData.pre_evolutions[name]) {
          const preDigimon = evolutionData.digimons[preName]
          if (preDigimon) {
            predecessors.push(preDigimon)
            predecessors.push(...getAllPredecessors(preName, new Set(visited)))
          }
        }
      }
      return predecessors
    }

    const getAllSuccessors = (name, visited = new Set()) => {
      if (visited.has(name)) return []
      visited.add(name)
      
      let successors = []
      if (evolutionData.evolutions[name]) {
        for (const evoName of evolutionData.evolutions[name]) {
          const evoDigimon = evolutionData.digimons[evoName]
          if (evoDigimon) {
            successors.push(evoDigimon)
            successors.push(...getAllSuccessors(evoName, new Set(visited)))
          }
        }
      }
      return successors
    }

    result.complete_line.predecessors = getAllPredecessors(digimonName)
    result.complete_line.successors = getAllSuccessors(digimonName)

    return result
  }

  const handleDigimonSelect = (digimon) => {
    setSelectedDigimon(getEvolutionLine(digimon.name))
    setCurrentView('evolution')
    setSearchQuery('')
    setSearchResults([])
  }

  const getStageColor = (stage) => {
    const colors = {
      'I': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
      'II': 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700',
      'III': 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700',
      'IV': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
      'V': 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700',
      'VI': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 dark:border-fuchsia-700',
      'VI+': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
      'Human Hybrid': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
      'Beast Hybrid': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700'
    }
    return colors[stage] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700'
  }

  const getAttributeColor = (attribute) => {
    const colors = {
      'Vaccine': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
      'Data': 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700',
      'Virus': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
      'Variable': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700'
    }
    return colors[attribute] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700'
  }

  const getImageUrl = (digimon) => {
    if (digimon.image) {
      try {
        return new URL(`./assets/images/${digimon.image}`, import.meta.url).href
      } catch (e) {
        return null
      }
    }
    return null
  }

  const openImagePreview = (digimon) => {
    const url = getImageUrl(digimon)
    if (!url) return
    setImagePreview({ url, alt: digimon.name })
  }

  const closeImagePreview = () => setImagePreview(null)

  // Componente para mostrar requisitos de evolução
  const EvolutionRequirements = ({ requirements }) => {
    if (!requirements) return null

    return (
      <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-500" />
          Requisitos para Evolução
        </div>
        <div className="space-y-2">
          {requirements.stats && requirements.stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Lightning className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">{stat.description}</span>
            </div>
          ))}
          {requirements.other && requirements.other.map((req, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">{req.description}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Componente para card de Digimon
  const DigimonCard = ({ digimon, onClick, showFullInfo = false, showRequirements = false }) => {
    const imageUrl = getImageUrl(digimon)
    
    return (
      <div className="group relative">
        <button
          onClick={() => onClick(digimon)}
          className="w-full text-left p-4 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:bg-white/95 dark:hover:bg-gray-900/95 hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
        >
          <div className="flex items-center gap-4">
            <div
              className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center group-hover:shadow-md transition-all duration-300 cursor-zoom-in border-2 border-gray-200/50 dark:border-gray-600/50"
              onClick={(e) => {
                e.stopPropagation()
                openImagePreview(digimon)
              }}
              title="Clique para ampliar"
            >
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={digimon.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div className={`w-full h-full flex items-center justify-center ${imageUrl ? 'hidden' : ''}`}>
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-bold text-lg text-gray-900 dark:text-white truncate mb-1">
                {digimon.name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-2">
                <span className="font-semibold">#{digimon.number}</span>
                {showFullInfo && (
                  <>
                    <Badge className={`${getStageColor(digimon.stage)} text-xs font-semibold border`}>
                      Stage {digimon.stage}
                    </Badge>
                    <Badge className={`${getAttributeColor(digimon.attribute)} text-xs font-semibold border`}>
                      {digimon.attribute}
                    </Badge>
                  </>
                )}
                {!showFullInfo && (
                  <span>Stage {digimon.stage} • {digimon.attribute}</span>
                )}
              </div>
            </div>
            
            <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-blue-500 transition-colors duration-300" />
          </div>
          
          {showRequirements && digimon.requirements && (
            <EvolutionRequirements requirements={digimon.requirements} />
          )}
        </button>
      </div>
    )
  }

  // Componente para listagem de todos os Digimons
  const DigimonList = () => {
    if (!evolutionData) return null

    const digimonsByStage = {}
    Object.values(evolutionData.digimons).forEach(digimon => {
      if (!digimonsByStage[digimon.stage]) {
        digimonsByStage[digimon.stage] = []
      }
      digimonsByStage[digimon.stage].push(digimon)
    })

    // Ordenar stages
    const stageOrder = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VI+', 'Human Hybrid', 'Beast Hybrid']
    const sortedStages = stageOrder.filter(stage => digimonsByStage[stage])

    return (
      <div className="space-y-8">
        {sortedStages.map(stage => (
          <Card key={stage} className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl shadow-gray-500/10 dark:shadow-black/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <Badge className={`${getStageColor(stage)} text-sm font-bold border px-3 py-1`}>
                  Stage {stage}
                </Badge>
                <span className="text-lg text-gray-600 dark:text-gray-400 font-semibold">
                  {digimonsByStage[stage].length} Digimons
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {digimonsByStage[stage]
                  .sort((a, b) => {
                    const an = Number(a?.number)
                    const bn = Number(b?.number)
                    const aIsNum = Number.isFinite(an)
                    const bIsNum = Number.isFinite(bn)
                    if (aIsNum && bIsNum) return an - bn
                    if (aIsNum) return -1
                    if (bIsNum) return 1
                    const as = String(a?.number ?? '').localeCompare(String(b?.number ?? ''))
                    if (as !== 0) return as
                    return a.name.localeCompare(b.name)
                  })
                  .map(digimon => (
                    <DigimonCard
                      key={digimon.name}
                      digimon={digimon}
                      onClick={handleDigimonSelect}
                      showFullInfo={true}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Componente para árvore evolutiva
  const EvolutionTree = ({ digimonName, direction = 'successors' }) => {
    if (!evolutionData || !digimonName) return null

    const buildTree = (name, visited = new Set(), depth = 0) => {
      if (visited.has(name) || depth > 10) return null
      visited.add(name)

      const digimon = evolutionData.digimons[name]
      if (!digimon) return null

      const connections = direction === 'successors' 
        ? evolutionData.evolutions[name] || []
        : evolutionData.pre_evolutions[name] || []

      const children = connections
        .map(childName => buildTree(childName, new Set(visited), depth + 1))
        .filter(Boolean)

      return {
        digimon,
        children,
        depth
      }
    }

    const TreeNode = ({ node, isLast = false, prefix = '' }) => {
      const hasChildren = node.children.length > 0
      const nodeId = `${node.digimon.name}-${node.depth}`
      const isExpanded = expandedNodes.has(nodeId)

      const toggleExpanded = (e) => {
        e.stopPropagation()
        const newExpanded = new Set(expandedNodes)
        if (isExpanded) {
          newExpanded.delete(nodeId)
        } else {
          newExpanded.add(nodeId)
        }
        setExpandedNodes(newExpanded)
      }

      return (
        <div className="select-none">
          <div className="flex items-center gap-3 py-2">
            <span className="text-gray-400 font-mono text-lg">
              {prefix}
              {isLast ? '└─' : '├─'}
            </span>
            
            {hasChildren && (
              <button
                onClick={toggleExpanded}
                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
              >
                {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            )}
            
            <button
              onClick={() => handleDigimonSelect(node.digimon)}
              className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-colors">
                {getImageUrl(node.digimon) ? (
                  <img 
                    src={getImageUrl(node.digimon)} 
                    alt={node.digimon.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                )}
              </div>
              
              <span className="font-semibold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {node.digimon.name}
              </span>
              
              <Badge className={`${getStageColor(node.digimon.stage)} text-sm font-semibold border`}>
                {node.digimon.stage}
              </Badge>
            </button>
          </div>
          
          {hasChildren && isExpanded && (
            <div className="ml-6">
              {node.children.map((child, index) => (
                <TreeNode
                  key={`${child.digimon.name}-${index}`}
                  node={child}
                  isLast={index === node.children.length - 1}
                  prefix={prefix + (isLast ? '   ' : '│  ')}
                />
              ))}
            </div>
          )}
        </div>
      )
    }

    const tree = buildTree(digimonName)
    if (!tree) return null

    return (
      <div className="font-mono text-base bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-inner">
        <TreeNode node={tree} isLast={true} />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `linear-gradient(rgba(10,15,25,0.6), rgba(10,15,25,0.6)), url(${pageBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Header Melhorado */}
      <div className="relative overflow-hidden h-56 md:h-100">
        {/* Hero image background */}
        <div
          className="absolute inset-0 bg-no-repeat bg-cover"
          style={{
            backgroundImage: `url(${heroImg})`,
            backgroundPosition: '85% center',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)'
          }}
        ></div>
        {/* Subtle dark scrim to improve text contrast */}
        <div className="absolute inset-0 bg-black/35"></div>
        
        <div className="relative z-10 px-4 py-12 md:py-16">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="p-3 bg-black/30 rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg">
                <Zap className="w-8 h-8 md:w-10 md:h-15 text-white" />
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg">
                Visualizador de Linhas Evolutivas
              </h1>
            </div>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
              Explore evoluções completas, requisitos detalhados e árvores visuais dos Digimons
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Melhorada */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2 p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <Button
              variant={currentView === 'search' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('search')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                currentView === 'search' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Search className="w-5 h-5" />
              Buscar
            </Button>
            <Button
              variant={currentView === 'list' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('list')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                currentView === 'list' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
              Listar Todos
            </Button>
            {selectedDigimon && (
              <Button
                variant={currentView === 'evolution' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('evolution')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  currentView === 'evolution' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <TreePine className="w-5 h-5" />
                {selectedDigimon.digimon.name}
              </Button>
            )}
          </div>
        </div>

        {/* Search View */}
        {currentView === 'search' && (
          <div className="max-w-3xl mx-auto space-y-8">
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                  <Search className="w-6 h-6 text-blue-500" />
                  Buscar Digimon
                </CardTitle>
                <CardDescription className="text-lg">
                  Digite o nome de um Digimon para ver sua linha evolutiva completa com requisitos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Ex: Agumon, Coronamon, Guilmon..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-4 text-lg bg-white/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
              </CardContent>
            </Card>

            {searchResults.length > 0 && (
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl">
                    Resultados da Busca ({searchResults.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {searchResults.map((digimon) => (
                      <DigimonCard
                        key={digimon.name}
                        digimon={digimon}
                        onClick={handleDigimonSelect}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

{searchQuery.trim() === '' && (
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <Info className="w-6 h-6 text-blue-500" />
                    Como usar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-gray-700 dark:text-gray-300">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0">
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">1</span>
                      </div>
                      <div>
                        <strong className="text-gray-900 dark:text-white">Buscar:</strong> Digite o nome de qualquer Digimon no campo acima
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0">
                        <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">2</span>
                      </div>
                      <div>
                        <strong className="text-gray-900 dark:text-white">Selecionar:</strong> Clique no resultado desejado para ver detalhes
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0">
                        <span className="text-green-600 dark:text-green-400 font-bold text-sm">3</span>
                      </div>
                      <div>
                        <strong className="text-gray-900 dark:text-white">Explorar:</strong> Veja evoluções, requisitos e árvore visual completa
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0">
                        <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">4</span>
                      </div>
                      <div>
                        <strong className="text-gray-900 dark:text-white">Navegar:</strong> Clique em qualquer Digimon para continuar explorando
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {currentView === 'list' && <DigimonList />}

        {currentView === 'evolution' && selectedDigimon && (
          <div className="space-y-8">
            {/* Selected Digimon Info */}
            <Card className="border-2 border-blue-300 dark:border-blue-600 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 backdrop-blur-md shadow-xl">
              <CardHeader>
                <div className="flex items-start gap-6">
                  <div 
                    className="flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center shadow-lg border-2 border-gray-200 dark:border-gray-600 cursor-zoom-in group"
                    onClick={() => openImagePreview(selectedDigimon.digimon)}
                    title="Clique para ampliar"
                  >
                    {getImageUrl(selectedDigimon.digimon) ? (
                      <img 
                        src={getImageUrl(selectedDigimon.digimon)} 
                        alt={selectedDigimon.digimon.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3 text-3xl mb-3">
                      <Info className="w-8 h-8 text-blue-600" />
                      {selectedDigimon.digimon.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-3 text-lg">
                      <span className="font-semibold">#{selectedDigimon.digimon.number}</span>
                      <Badge className={`${getStageColor(selectedDigimon.digimon.stage)} text-sm font-bold border px-3 py-1`}>
                        Stage {selectedDigimon.digimon.stage}
                      </Badge>
                      <Badge className={`${getAttributeColor(selectedDigimon.digimon.attribute)} text-sm font-bold border px-3 py-1`}>
                        {selectedDigimon.digimon.attribute}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Tabs for different views */}
            <Tabs defaultValue="evolutions" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-0">
                <TabsTrigger value="evolutions" className="rounded-xl font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white py-0">Evoluções</TabsTrigger>
                <TabsTrigger value="tree-successors" className="rounded-xl font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white py-0">Árvore Futura</TabsTrigger>
                <TabsTrigger value="tree-predecessors" className="rounded-xl font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white py-0">Árvore Passada</TabsTrigger>
              </TabsList>
              
              <TabsContent value="evolutions" className="space-y-8 mt-8">
                {/* Evolution Lines */}
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Evolves From */}
                  <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-green-600 dark:text-green-400 text-xl">
                        <ArrowLeft className="w- h-6" />
                        Evolui De ({selectedDigimon.evolves_from.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedDigimon.evolves_from.length > 0 ? (
                        <div className="space-y-4">
                          {selectedDigimon.evolves_from.map((digimon) => (
                            <DigimonCard
                              key={digimon.name}
                              digimon={digimon}
                              onClick={handleDigimonSelect}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic text-center py-8">
                          Nenhuma pré-evolução direta encontrada
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Evolves To */}
                  <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-blue-600 dark:text-blue-400 text-xl">
                        <ArrowRight className="w-6 h-6" />
                        Evolui Para ({selectedDigimon.evolves_to.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedDigimon.evolves_to.length > 0 ? (
                        <div className="space-y-4">
                          {selectedDigimon.evolves_to.map((digimon) => (
                            <DigimonCard
                              key={digimon.name}
                              digimon={digimon}
                              onClick={handleDigimonSelect}
                              showRequirements={true}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic text-center py-8">
                          Nenhuma evolução direta encontrada
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="tree-successors" className="mt-8">
                <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-orange-600 dark:text-orange-400 text-xl">
                      <TreePine className="w-6 h-6" />
                      Árvore Evolutiva - Sucessores
                    </CardTitle>
                    <CardDescription className="text-base">
                      Visualização em árvore de todas as evoluções futuras possíveis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EvolutionTree 
                      digimonName={selectedDigimon.digimon.name} 
                      direction="successors" 
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="tree-predecessors" className="mt-8">
                <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-purple-600 dark:text-purple-400 text-xl">
                      <TreePine className="w-6 h-6" />
                      Árvore Evolutiva - Predecessores
                    </CardTitle>
                    <CardDescription className="text-base">
                      Visualização em árvore de todas as pré-evoluções possíveis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EvolutionTree 
                      digimonName={selectedDigimon.digimon.name} 
                      direction="predecessors" 
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {imagePreview && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeImagePreview}
        >
            <div className="relative max-w-4xl max-h-full bg-gray-900/70 rounded-xl border border-white/10 p-4">
            <button
              onClick={closeImagePreview}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="text-center text-white font-semibold mb-3">
              {imagePreview.alt}
            </div>
            <img
              src={imagePreview.url}
              alt={imagePreview.alt}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
