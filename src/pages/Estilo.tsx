import { Banknote, Smartphone } from 'lucide-react'
import { useState } from 'react'
import logo from '../assets/logo-gonza.svg'
import { CampoImporte } from '../components/caja/CampoImporte'
import { Boton } from '../components/ui/Boton'
import { Campo } from '../components/ui/Campo'
import { Aviso, Chip, EtiquetaMedio, Tarjeta, Titulo } from '../components/ui/Estados'
import { Segmentado } from '../components/ui/Segmentado'
import { formatearPesos } from '../lib/formato'
import { useTema, type Tema } from '../lib/tema'

/**
 * Muestrario del sistema visual (no guarda nada). Sirve para revisar colores, tipografía
 * y la carga por teclado sin necesitar la base.
 */

const COLORES = [
  { nombre: 'Bordó (marca, Efectivo)', variable: '--marca' },
  { nombre: 'Azul (Digital)', variable: '--digital' },
  { nombre: 'Fondo', variable: '--fondo' },
  { nombre: 'Superficie', variable: '--superficie' },
  { nombre: 'Texto', variable: '--texto' },
  { nombre: 'Texto suave', variable: '--texto-suave' },
  { nombre: 'Correcto', variable: '--ok' },
  { nombre: 'Error', variable: '--alerta' },
]

export function Estilo() {
  const [importe, setImporte] = useState(0)
  const [ultima, setUltima] = useState<string | null>(null)
  const [tema, setTema] = useTema()

  const guardar = (medio: 'efectivo' | 'digital') => {
    if (importe <= 0) return
    setUltima(
      `Guardada · ${medio === 'efectivo' ? 'Efectivo' : 'Digital'} ${formatearPesos(importe, { sinCentavos: true })}`,
    )
    setImporte(0)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Titulo
        subtitulo="Muestrario del sistema visual de Avícola GD"
        accion={
          <Segmentado<Tema>
            etiqueta="Tema"
            valor={tema}
            onCambio={setTema}
            opciones={[
              { valor: 'sistema', texto: 'Automático' },
              { valor: 'claro', texto: 'Claro' },
              { valor: 'oscuro', texto: 'Oscuro' },
            ]}
          />
        }
      >
        Guía de estilo
      </Titulo>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,30rem)_1fr]">
        <Tarjeta titulo="Nueva venta" className="self-start p-6">
          <div className="flex flex-col gap-4">
            <CampoImporte
              etiqueta="Importe"
              importe={importe}
              onCambio={setImporte}
              onAccion={(a) => (a === 'borrar' ? setImporte(0) : guardar(a))}
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => guardar('efectivo')}
                aria-label="Guardar venta en efectivo"
                className="flex min-h-16 items-center gap-2 rounded-xl bg-efectivo px-4 text-lg font-semibold text-sobre-medio shadow-tarjeta"
              >
                <Banknote className="size-5" aria-hidden="true" /> Efectivo
              </button>
              <button
                type="button"
                onClick={() => guardar('digital')}
                aria-label="Guardar venta digital"
                className="flex min-h-16 items-center gap-2 rounded-xl bg-digital px-4 text-lg font-semibold text-sobre-medio shadow-tarjeta"
              >
                <Smartphone className="size-5" aria-hidden="true" /> Digital
              </button>
            </div>
            <p className="text-sm text-suave">Enter = Efectivo · + = Digital · Esc = borrar</p>
            <div role="status" className="min-h-6 text-sm font-semibold text-ok">
              {ultima && `✓ ${ultima}`}
            </div>
          </div>
        </Tarjeta>

        <div className="flex flex-col gap-6">
          <Tarjeta titulo="Colores">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {COLORES.map((c) => (
                <li key={c.variable} className="overflow-hidden rounded-lg border border-borde">
                  <div className="h-12" style={{ background: `var(${c.variable})` }} />
                  <p className="px-2 py-1.5 text-xs text-suave">{c.nombre}</p>
                </li>
              ))}
            </ul>
          </Tarjeta>

          <Tarjeta titulo="Componentes">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Boton>Guardar egreso</Boton>
                <Boton variante="secundario">Cancelar</Boton>
                <Boton variante="peligro">Anular venta</Boton>
                <Boton variante="fantasma">Ver más</Boton>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Chip tono="ok">● Día abierto</Chip>
                <Chip tono="error">Anulada</Chip>
                <Chip tono="aviso">▲ Sobran $ 1.200</Chip>
                <Chip>Cerrado</Chip>
                <EtiquetaMedio medio="efectivo" />
                <EtiquetaMedio medio="digital" />
              </div>
              <Campo etiqueta="Proveedor" placeholder="Ej.: Granja Don Luis" />
              <Aviso tono="error">
                Sin internet: no se guardó. Revisá la conexión y probá de nuevo.
              </Aviso>
              <Aviso tono="ok">Egreso guardado: Bolsas $ 15.000,00</Aviso>
            </div>
          </Tarjeta>

          <Tarjeta titulo="Logo">
            <div className="w-48 rounded-lg bg-white p-4">
              <img src={logo} alt="Gonza — Carnicería, Chanchería, Avícola" />
            </div>
          </Tarjeta>
        </div>
      </div>
    </div>
  )
}
