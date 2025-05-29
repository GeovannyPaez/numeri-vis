"use client"

import type React from "react"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, RotateCcw, BarChart3, ZoomIn, ZoomOut, RefreshCw } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Analizador y evaluador de funciones matemáticas
class FunctionParser {
  static evaluate(expression: string, x: number): number {
    try {
      // Primero reemplazamos la variable x con su valor
      let safeExpression = expression.replace(/\bx\b/g, `(${x})`)

      // Reemplazar operador de potencia
      safeExpression = safeExpression.replace(/\^/g, "**")

      // Reemplazar constantes matemáticas con cuidado (usando límites de palabra)
      safeExpression = safeExpression.replace(/\bpi\b/g, "Math.PI")
      safeExpression = safeExpression.replace(/\be\b/g, "Math.E")

      // Reemplazar funciones matemáticas
      safeExpression = safeExpression
        .replace(/\bsin\b/g, "Math.sin")
        .replace(/\bcos\b/g, "Math.cos")
        .replace(/\btan\b/g, "Math.tan")
        .replace(/\blog\b/g, "Math.log")
        .replace(/\bln\b/g, "Math.log")
        .replace(/\bsqrt\b/g, "Math.sqrt")
        .replace(/\babs\b/g, "Math.abs")
        .replace(/\bexp\b/g, "Math.exp")

      // Usar Function constructor para evaluación más segura
      const evalFunction = new Function("Math", `return ${safeExpression}`)
      return evalFunction(Math)
    } catch (error) {
      console.error("Error evaluando función:", error, "Expresión:", expression)
      throw new Error("Expresión de función inválida")
    }
  }
}

// Implementaciones de métodos numéricos
interface ResultadoIteracion {
  iteracion: number
  a?: number
  b?: number
  x: number
  fx: number
  error?: number
}

interface ResultadoMetodo {
  resultado: number
  iteraciones: ResultadoIteracion[]
  convergio: boolean
  metodo: string
  tiempo?: number
}

class MetodosNumericos {
  static biseccion(func: string, a: number, b: number, tolerancia: number, maxIteraciones: number): ResultadoMetodo {
    const inicio = performance.now()
    const iteraciones: ResultadoIteracion[] = []
    let fa = FunctionParser.evaluate(func, a)
    let fb = FunctionParser.evaluate(func, b)

    if (fa * fb > 0) {
      throw new Error("La función debe tener signos opuestos en los extremos del intervalo")
    }

    let iteracion = 0
    let c = a
    let fc = fa

    while (iteracion < maxIteraciones) {
      c = (a + b) / 2
      fc = FunctionParser.evaluate(func, c)

      const error = Math.abs(b - a) / 2

      iteraciones.push({
        iteracion: iteracion + 1,
        a,
        b,
        x: c,
        fx: fc,
        error,
      })

      if (error < tolerancia || Math.abs(fc) < tolerancia) {
        const tiempo = performance.now() - inicio
        return { resultado: c, iteraciones, convergio: true, metodo: "biseccion", tiempo }
      }

      if (fa * fc < 0) {
        b = c
        fb = fc
      } else {
        a = c
        fa = fc
      }

      iteracion++
    }

    const tiempo = performance.now() - inicio
    return { resultado: c, iteraciones, convergio: false, metodo: "biseccion", tiempo }
  }

  static falsaPosicion(
    func: string,
    a: number,
    b: number,
    tolerancia: number,
    maxIteraciones: number,
  ): ResultadoMetodo {
    const inicio = performance.now()
    const iteraciones: ResultadoIteracion[] = []
    let fa = FunctionParser.evaluate(func, a)
    let fb = FunctionParser.evaluate(func, b)

    if (fa * fb > 0) {
      throw new Error("La función debe tener signos opuestos en los extremos del intervalo")
    }

    let iteracion = 0
    let c = a
    let fc = fa
    let prevC = a

    while (iteracion < maxIteraciones) {
      c = (a * fb - b * fa) / (fb - fa)
      fc = FunctionParser.evaluate(func, c)

      const error = iteracion > 0 ? Math.abs(c - prevC) : Math.abs(b - a)

      iteraciones.push({
        iteracion: iteracion + 1,
        a,
        b,
        x: c,
        fx: fc,
        error,
      })

      if (error < tolerancia || Math.abs(fc) < tolerancia) {
        const tiempo = performance.now() - inicio
        return { resultado: c, iteraciones, convergio: true, metodo: "falsaPosicion", tiempo }
      }

      if (fa * fc < 0) {
        b = c
        fb = fc
      } else {
        a = c
        fa = fc
      }

      prevC = c
      iteracion++
    }

    const tiempo = performance.now() - inicio
    return { resultado: c, iteraciones, convergio: false, metodo: "falsaPosicion", tiempo }
  }

  static secante(func: string, x0: number, x1: number, tolerancia: number, maxIteraciones: number): ResultadoMetodo {
    const inicio = performance.now()
    const iteraciones: ResultadoIteracion[] = []
    let f0 = FunctionParser.evaluate(func, x0)
    let f1 = FunctionParser.evaluate(func, x1)

    let iteracion = 0
    let x2 = x1

    while (iteracion < maxIteraciones) {
      if (Math.abs(f1 - f0) < 1e-14) {
        throw new Error("División por cero en el método de la secante")
      }

      x2 = x1 - (f1 * (x1 - x0)) / (f1 - f0)
      const f2 = FunctionParser.evaluate(func, x2)

      const error = Math.abs(x2 - x1)

      iteraciones.push({
        iteracion: iteracion + 1,
        x: x2,
        fx: f2,
        error,
      })

      if (error < tolerancia || Math.abs(f2) < tolerancia) {
        const tiempo = performance.now() - inicio
        return { resultado: x2, iteraciones, convergio: true, metodo: "secante", tiempo }
      }

      x0 = x1
      f0 = f1
      x1 = x2
      f1 = f2
      iteracion++
    }

    const tiempo = performance.now() - inicio
    return { resultado: x2, iteraciones, convergio: false, metodo: "secante", tiempo }
  }
}

// Componente de gráfico interactivo con zoom
function GraficoFuncion({
  func,
  iteraciones,
  metodo,
  dominio = [-5, 5],
}: {
  func: string
  iteraciones: ResultadoIteracion[]
  metodo: string
  dominio?: [number, number]
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [dominioActual, setDominioActual] = useState(dominio)
  const [rangoActual, setRangoActual] = useState<[number, number]>([-10, 10])

  const padding = 60
  const ancho = 800
  const alto = 600

  const puntos = useMemo(() => {
    const [xMin, xMax] = dominioActual
    const paso = (xMax - xMin) / 400 // Más puntos para una curva más suave
    const pts: Array<[number, number]> = []

    for (let x = xMin; x <= xMax; x += paso) {
      try {
        const y = FunctionParser.evaluate(func, x)
        if (isFinite(y) && Math.abs(y) < 100) {
          pts.push([x, y])
        }
      } catch (error) {
        // Omitir puntos inválidos
      }
    }
    return pts
  }, [func, dominioActual])

  useEffect(() => {
    if (puntos.length === 0) {
      setRangoActual([-10, 10])
      return
    }

    const valoresY = puntos.map((p) => p[1])
    const yMin = Math.min(...valoresY)
    const yMax = Math.max(...valoresY)
    const padding = (yMax - yMin) * 0.1
    setRangoActual([yMin - padding, yMax + padding])
  }, [puntos])

  const escalaX = (x: number) =>
    padding + ((x - dominioActual[0]) / (dominioActual[1] - dominioActual[0])) * (ancho - 2 * padding)
  const escalaY = (y: number) =>
    alto - padding - ((y - rangoActual[0]) / (rangoActual[1] - rangoActual[0])) * (alto - 2 * padding)

  const datosPath = puntos
    .map((punto, i) => `${i === 0 ? "M" : "L"} ${escalaX(punto[0])} ${escalaY(punto[1])}`)
    .join(" ")

  // Función para generar líneas de cuadrícula
  const generarLineasCuadricula = () => {
    const lineas = []
    const pasoX = (dominioActual[1] - dominioActual[0]) / 10
    const pasoY = (rangoActual[1] - rangoActual[0]) / 10

    // Líneas verticales
    for (let x = dominioActual[0]; x <= dominioActual[1]; x += pasoX) {
      lineas.push(
        <line
          key={`vline-${x}`}
          x1={escalaX(x)}
          y1={padding}
          x2={escalaX(x)}
          y2={alto - padding}
          stroke="#e5e7eb"
          strokeWidth="1"
        />,
      )
      // Etiquetas del eje X
      if (x !== 0) {
        // Evitar superposición con el eje Y
        lineas.push(
          <text
            key={`vlabel-${x}`}
            x={escalaX(x)}
            y={alto - padding / 2}
            textAnchor="middle"
            fontSize="12"
            fill="#6b7280"
          >
            {x.toFixed(1)}
          </text>,
        )
      }
    }

    // Líneas horizontales
    for (let y = rangoActual[0]; y <= rangoActual[1]; y += pasoY) {
      lineas.push(
        <line
          key={`hline-${y}`}
          x1={padding}
          y1={escalaY(y)}
          x2={ancho - padding}
          y2={escalaY(y)}
          stroke="#e5e7eb"
          strokeWidth="1"
        />,
      )
      // Etiquetas del eje Y
      if (y !== 0) {
        // Evitar superposición con el eje X
        lineas.push(
          <text key={`hlabel-${y}`} x={padding / 2} y={escalaY(y)} textAnchor="middle" fontSize="12" fill="#6b7280">
            {y.toFixed(1)}
          </text>,
        )
      }
    }

    return lineas
  }

  // Funciones para zoom y pan
  const handleZoomIn = () => {
    const newScale = scale * 1.2
    setScale(newScale)

    // Ajustar dominio y rango
    const centerX = (dominioActual[0] + dominioActual[1]) / 2
    const centerY = (rangoActual[0] + rangoActual[1]) / 2
    const newWidthX = (dominioActual[1] - dominioActual[0]) / 1.2
    const newWidthY = (rangoActual[1] - rangoActual[0]) / 1.2

    setDominioActual([centerX - newWidthX / 2, centerX + newWidthX / 2])
    setRangoActual([centerY - newWidthY / 2, centerY + newWidthY / 2])
  }

  const handleZoomOut = () => {
    const newScale = scale / 1.2
    setScale(newScale)

    // Ajustar dominio y rango
    const centerX = (dominioActual[0] + dominioActual[1]) / 2
    const centerY = (rangoActual[0] + rangoActual[1]) / 2
    const newWidthX = (dominioActual[1] - dominioActual[0]) * 1.2
    const newWidthY = (rangoActual[1] - rangoActual[0]) * 1.2

    setDominioActual([centerX - newWidthX / 2, centerX + newWidthX / 2])
    setRangoActual([centerY - newWidthY / 2, centerY + newWidthY / 2])
  }

  const handleReset = () => {
    setScale(1)
    setDominioActual(dominio)
    setRangoActual([-10, 10])
  }

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (svgRef.current) {
      const pt = svgRef.current.createSVGPoint()
      pt.x = e.clientX
      pt.y = e.clientY
      const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse())

      setIsDragging(true)
      setDragStart({ x: svgP.x, y: svgP.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !svgRef.current) return

    const pt = svgRef.current.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse())

    const dx = svgP.x - dragStart.x
    const dy = svgP.y - dragStart.y

    // Convertir el desplazamiento de píxeles a unidades de dominio/rango
    const dDominio = (dominioActual[1] - dominioActual[0]) * (dx / (ancho - 2 * padding))
    const dRango = (rangoActual[1] - rangoActual[0]) * (dy / (alto - 2 * padding))

    setDominioActual([dominioActual[0] - dDominio, dominioActual[1] - dDominio])
    setRangoActual([rangoActual[0] + dRango, rangoActual[1] + dRango])

    setDragStart({ x: svgP.x, y: svgP.y })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div className="w-full">
      <div className="flex justify-end space-x-2 mb-2">
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4 mr-1" />
          Acercar
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4 mr-1" />
          Alejar
        </Button>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Restablecer
        </Button>
      </div>
      <div className="border rounded-lg bg-white overflow-hidden">
        <svg
          ref={svgRef}
          width="100%"
          height="600"
          viewBox={`0 0 ${ancho} ${alto}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          {/* Líneas de cuadrícula */}
          {generarLineasCuadricula()}

          {/* Ejes */}
          <line x1={padding} y1={escalaY(0)} x2={ancho - padding} y2={escalaY(0)} stroke="#666" strokeWidth="2" />
          <line x1={escalaX(0)} y1={padding} x2={escalaX(0)} y2={alto - padding} stroke="#666" strokeWidth="2" />

          {/* Curva de la función */}
          {datosPath && <path d={datosPath} fill="none" stroke="#2563eb" strokeWidth="2" />}

          {/* Puntos de iteración */}
          {iteraciones.map((iter, i) => (
            <g key={i}>
              <circle cx={escalaX(iter.x)} cy={escalaY(iter.fx)} r="5" fill="#dc2626" stroke="white" strokeWidth="2" />
              <text
                x={escalaX(iter.x)}
                y={escalaY(iter.fx) - 10}
                textAnchor="middle"
                fontSize="12"
                fill="#dc2626"
                fontWeight="bold"
              >
                {iter.iteracion}
              </text>
            </g>
          ))}

          {/* Etiquetas de ejes */}
          <text x={ancho / 2} y={alto - 10} textAnchor="middle" fontSize="14" fill="#666">
            x
          </text>
          <text
            x={15}
            y={alto / 2}
            textAnchor="middle"
            fontSize="14"
            fill="#666"
            transform={`rotate(-90, 15, ${alto / 2})`}
          >
            f(x)
          </text>
        </svg>
      </div>
      <div className="text-center text-sm text-gray-500 mt-2">
        <p>Arrastra para mover la vista. Usa los botones para acercar o alejar.</p>
      </div>
    </div>
  )
}

export default function InterfazMetodosNumericos() {
  const [func, setFunc] = useState("x**3 - 4*x + 1")
  const [metodo, setMetodo] = useState("biseccion")
  const [a, setA] = useState("0")
  const [b, setB] = useState("1")
  const [x0, setX0] = useState("0")
  const [x1, setX1] = useState("1")
  const [tolerancia, setTolerancia] = useState("0.0001")
  const [maxIteraciones, setMaxIteraciones] = useState("50")
  const [resultado, setResultado] = useState<ResultadoMetodo | null>(null)
  const [comparacion, setComparacion] = useState<ResultadoMetodo[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [calculando, setCalculando] = useState(false)
  const [activeTab, setActiveTab] = useState("visual")

  const descripcionesMetodos = {
    biseccion:
      "Divide repetidamente un intervalo y selecciona el subintervalo donde la función cambia de signo. Garantiza convergencia pero es más lento.",
    falsaPosicion:
      "Usa interpolación lineal para encontrar la raíz. A menudo más rápido que bisección pero puede converger lentamente en algunos casos.",
    secante:
      "Usa dos puntos iniciales para aproximar la derivada. Convergencia más rápida que bisección pero puede no converger siempre.",
  }

  const ejemplosFunciones = [
    { nombre: "Polinómica", funcion: "x**3 - 4*x + 1", intervalo: "[0, 1]" },
    { nombre: "Trigonométrica", funcion: "sin(x) - x/3", intervalo: "[1, 3]" },
    { nombre: "Exponencial", funcion: "exp(x) - 2*x - 1", intervalo: "[0, 2]" },
    { nombre: "Logarítmica", funcion: "log(x) - x + 2", intervalo: "[1, 3]" },
    { nombre: "Mixta", funcion: "x*cos(x) - sin(x)", intervalo: "[1, 2]" },
  ]

  const calcular = useCallback(async () => {
    setCalculando(true)
    setError(null)

    try {
      const tol = Number.parseFloat(tolerancia)
      const maxIter = Number.parseInt(maxIteraciones)

      let resultadoMetodo: ResultadoMetodo

      switch (metodo) {
        case "biseccion":
          resultadoMetodo = MetodosNumericos.biseccion(func, Number.parseFloat(a), Number.parseFloat(b), tol, maxIter)
          break
        case "falsaPosicion":
          resultadoMetodo = MetodosNumericos.falsaPosicion(
            func,
            Number.parseFloat(a),
            Number.parseFloat(b),
            tol,
            maxIter,
          )
          break
        case "secante":
          resultadoMetodo = MetodosNumericos.secante(func, Number.parseFloat(x0), Number.parseFloat(x1), tol, maxIter)
          break
        default:
          throw new Error("Método desconocido")
      }

      setResultado(resultadoMetodo)
      setComparacion(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error")
    } finally {
      setCalculando(false)
    }
  }, [func, metodo, a, b, x0, x1, tolerancia, maxIteraciones])

  const compararMetodos = useCallback(async () => {
    setCalculando(true)
    setError(null)

    try {
      const tol = Number.parseFloat(tolerancia)
      const maxIter = Number.parseInt(maxIteraciones)
      const resultados: ResultadoMetodo[] = []

      // Bisección
      try {
        const resBiseccion = MetodosNumericos.biseccion(func, Number.parseFloat(a), Number.parseFloat(b), tol, maxIter)
        resultados.push(resBiseccion)
      } catch (err) {
        console.log("Error en bisección:", err)
      }

      // Falsa posición
      try {
        const resFalsaPosicion = MetodosNumericos.falsaPosicion(
          func,
          Number.parseFloat(a),
          Number.parseFloat(b),
          tol,
          maxIter,
        )
        resultados.push(resFalsaPosicion)
      } catch (err) {
        console.log("Error en falsa posición:", err)
      }

      // Secante
      try {
        const resSecante = MetodosNumericos.secante(func, Number.parseFloat(x0), Number.parseFloat(x1), tol, maxIter)
        resultados.push(resSecante)
      } catch (err) {
        console.log("Error en secante:", err)
      }

      if (resultados.length === 0) {
        throw new Error("Ningún método pudo ejecutarse correctamente")
      }

      setComparacion(resultados)
      setResultado(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error en la comparación")
    } finally {
      setCalculando(false)
    }
  }, [func, a, b, x0, x1, tolerancia, maxIteraciones])

  const reiniciar = () => {
    setResultado(null)
    setComparacion(null)
    setError(null)
  }

  const verificarIntervalo = useCallback((func: string, a: number, b: number): { valido: boolean; mensaje: string } => {
    try {
      const fa = FunctionParser.evaluate(func, a)
      const fb = FunctionParser.evaluate(func, b)

      if (fa * fb < 0) {
        return { valido: true, mensaje: "Intervalo válido: la función cambia de signo" }
      } else {
        return {
          valido: false,
          mensaje: `Intervalo inválido: f(${a}) = ${fa.toFixed(4)} y f(${b}) = ${fb.toFixed(4)} tienen el mismo signo. Prueba valores diferentes.`,
        }
      }
    } catch (error) {
      return { valido: false, mensaje: "Error evaluando la función en los extremos del intervalo" }
    }
  }, [])

  const cargarEjemplo = (funcion: string) => {
    setFunc(funcion)
    setError(null)
    setResultado(null)
    setComparacion(null)
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white p-4">
        <div className="mx-auto">
          {/* Encabezado expandido con controles */}
          <div className="mb-6">
            <div className="text-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Métodos Numéricos</h1>
              <p className="text-gray-600">Visualización de métodos de búsqueda de raíces</p>
            </div>

            {/* Controles en el header */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
    {/* Función */}
    <div className="border rounded-lg p-3 shadow-sm bg-white">
      <h3 className="text-sm font-medium mb-2">Función</h3>
      <div className="space-y-2">
        <div>
          <label htmlFor="function" className="text-xs block mb-1">
            f(x) =
          </label>
          <input
            id="function"
            value={func}
            onChange={(e) => setFunc(e.target.value)}
            placeholder="x**3 - 4*x + 1"
            className="w-full px-2 py-1 text-sm font-mono border rounded h-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {ejemplosFunciones.slice(0, 3).map((ejemplo, i) => (
            <button
              key={i}
              onClick={() => cargarEjemplo(ejemplo.funcion)}
              className="text-xs h-5 px-2 py-0 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              {ejemplo.nombre}
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs block mb-1">Método</label>
          <select 
            value={metodo} 
            onChange={(e) => setMetodo(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded h-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="biseccion">Bisección</option>
            <option value="falsaPosicion">Falsa Posición</option>
            <option value="secante">Secante</option>
          </select>
        </div>
      </div>
    </div>

    {/* Parámetros */}
    <div className="border rounded-lg p-3 shadow-sm bg-white">
      <h3 className="text-sm font-medium mb-2">Parámetros</h3>
      <div className="space-y-2">
        {(metodo === "biseccion" || metodo === "falsaPosicion") && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="a" className="text-xs block mb-1">a</label>
              <input
                id="a"
                type="number"
                step="0.1"
                value={a}
                onChange={(e) => setA(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded h-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="b" className="text-xs block mb-1">b</label>
              <input
                id="b"
                type="number"
                step="0.1"
                value={b}
                onChange={(e) => setB(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded h-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {metodo === "secante" && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="x0" className="text-xs block mb-1">x₀</label>
              <input
                id="x0"
                type="number"
                step="0.1"
                value={x0}
                onChange={(e) => setX0(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded h-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="x1" className="text-xs block mb-1">x₁</label>
              <input
                id="x1"
                type="number"
                step="0.1"
                value={x1}
                onChange={(e) => setX1(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded h-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="tolerance" className="text-xs block mb-1">Tolerancia</label>
            <input
              id="tolerance"
              type="number"
              step="0.0001"
              value={tolerancia}
              onChange={(e) => setTolerancia(e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded h-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="maxIterations" className="text-xs block mb-1">Máx. Iter.</label>
            <input
              id="maxIterations"
              type="number"
              value={maxIteraciones}
              onChange={(e) => setMaxIteraciones(e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded h-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>

    {/* Acciones */}
    <div className="border rounded-lg p-3 shadow-sm bg-white">
      <h3 className="text-sm font-medium mb-2">Acciones</h3>
      <div className="space-y-2">
        <div className="flex gap-2">
          <button 
            onClick={calcular} 
            disabled={calculando} 
            className="flex-1 text-sm h-8 px-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Play className="h-3 w-3 mr-1" />
            {calculando ? "..." : "Calcular"}
          </button>
          <button
            onClick={compararMetodos}
            disabled={calculando}
            className="flex-1 text-sm h-8 px-3 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Comparar
          </button>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={reiniciar} 
            className="flex-1 text-sm h-8 px-3 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reiniciar
          </button>
          {(metodo === "biseccion" || metodo === "falsaPosicion") && (
            <button
              onClick={() => {
                const resultado = verificarIntervalo(func, Number.parseFloat(a), Number.parseFloat(b))
                if (!resultado.valido) {
                  setError(resultado.mensaje)
                } else {
                  setError(null)
                }
              }}
              className="flex-1 text-xs h-8 px-3 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
            >
              Verificar
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
          </div>

          {/* Panel de visualización - ahora ocupa todo el ancho */}
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {(resultado || comparacion) && (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Resultados</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-2 mb-4">
                      <TabsTrigger value="visual">Análisis Visual</TabsTrigger>
                      <TabsTrigger value="numerico">Análisis Numérico</TabsTrigger>
                    </TabsList>

                    <TabsContent value="visual" className="mt-0">
                      {resultado && (
                        <GraficoFuncion func={func} iteraciones={resultado.iteraciones} metodo={resultado.metodo} />
                      )}
                      {comparacion && comparacion.length > 0 && (
                        <GraficoFuncion func={func} iteraciones={comparacion[0].iteraciones} metodo="comparacion" />
                      )}
                    </TabsContent>

                    <TabsContent value="numerico" className="mt-0">
                      {/* Resultados individuales */}
                      {resultado && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-medium">
                              Método:{" "}
                              {resultado.metodo === "biseccion"
                                ? "Bisección"
                                : resultado.metodo === "falsaPosicion"
                                  ? "Falsa Posición"
                                  : "Secante"}
                            </h3>
                            <Badge variant={resultado.convergio ? "default" : "destructive"}>
                              {resultado.convergio ? "Convergió" : "Máx. Iteraciones"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-gray-600">Raíz</p>
                              <p className="text-xl font-bold text-blue-600">{resultado.resultado.toFixed(6)}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                              <p className="text-sm text-gray-600">Iteraciones</p>
                              <p className="text-xl font-bold text-green-600">{resultado.iteraciones.length}</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <p className="text-sm text-gray-600">Error Final</p>
                              <p className="text-xl font-bold text-purple-600">
                                {resultado.iteraciones[resultado.iteraciones.length - 1]?.error?.toExponential(2) ||
                                  "N/A"}
                              </p>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg">
                              <p className="text-sm text-gray-600">Tiempo (ms)</p>
                              <p className="text-xl font-bold text-orange-600">
                                {resultado.tiempo?.toFixed(2) || "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Iteración</TableHead>
                                  {(resultado.metodo === "biseccion" || resultado.metodo === "falsaPosicion") && (
                                    <>
                                      <TableHead>a</TableHead>
                                      <TableHead>b</TableHead>
                                    </>
                                  )}
                                  <TableHead>x</TableHead>
                                  <TableHead>f(x)</TableHead>
                                  <TableHead>Error</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {resultado.iteraciones.map((iter) => (
                                  <TableRow key={iter.iteracion}>
                                    <TableCell className="font-medium">{iter.iteracion}</TableCell>
                                    {(resultado.metodo === "biseccion" || resultado.metodo === "falsaPosicion") && (
                                      <>
                                        <TableCell>{iter.a?.toFixed(6)}</TableCell>
                                        <TableCell>{iter.b?.toFixed(6)}</TableCell>
                                      </>
                                    )}
                                    <TableCell>{iter.x.toFixed(6)}</TableCell>
                                    <TableCell>{iter.fx.toFixed(6)}</TableCell>
                                    <TableCell>{iter.error?.toExponential(2)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      {/* Comparación de métodos */}
                      {comparacion && comparacion.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Comparación de Métodos</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Método</TableHead>
                                <TableHead>Raíz</TableHead>
                                <TableHead>Iteraciones</TableHead>
                                <TableHead>Error Final</TableHead>
                                <TableHead>Tiempo (ms)</TableHead>
                                <TableHead>Estado</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {comparacion.map((res, i) => (
                                <TableRow key={i}>
                                  <TableCell className="font-medium">
                                    {res.metodo === "biseccion" && "Bisección"}
                                    {res.metodo === "falsaPosicion" && "Falsa Posición"}
                                    {res.metodo === "secante" && "Secante"}
                                  </TableCell>
                                  <TableCell>{res.resultado.toFixed(6)}</TableCell>
                                  <TableCell>{res.iteraciones.length}</TableCell>
                                  <TableCell>
                                    {res.iteraciones[res.iteraciones.length - 1]?.error?.toExponential(2) || "N/A"}
                                  </TableCell>
                                  <TableCell>{res.tiempo?.toFixed(2) || "N/A"}</TableCell>
                                  <TableCell>
                                    <Badge variant={res.convergio ? "default" : "destructive"}>
                                      {res.convergio ? "Convergió" : "No convergió"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {!resultado && !comparacion && (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Visualización</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-[600px] flex items-center justify-center border border-dashed border-gray-200 rounded-lg">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>Ingresa una función y haz clic en "Calcular" para visualizar los resultados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Guía de funciones - Colapsable */}
          <Card className="mt-6 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Guía de Funciones Matemáticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">Funciones Trigonométricas:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>
                      <code>sin(x)</code> - Seno
                    </li>
                    <li>
                      <code>cos(x)</code> - Coseno
                    </li>
                    <li>
                      <code>tan(x)</code> - Tangente
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Exponenciales:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>
                      <code>exp(x)</code> - e^x
                    </li>
                    <li>
                      <code>log(x)</code> - Logaritmo natural
                    </li>
                    <li>
                      <code>sqrt(x)</code> - Raíz cuadrada
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Constantes:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>
                      <code>pi</code> - π (3.14159...)
                    </li>
                    <li>
                      <code>e</code> - e (2.71828...)
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Operadores:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>
                      <code>x**2</code> o <code>x^2</code> - Potencia
                    </li>
                    <li>
                      <code>+, -, *, /</code> - Operaciones básicas
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}
