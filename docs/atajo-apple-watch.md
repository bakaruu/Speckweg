# Kcal del Apple Watch en Speckweg

Hevy no da las calorías por la API ni en el CSV. Las del reloj están en la app Salud del iPhone, y la
única forma de sacarlas sin servidores es un Atajo que las guarde en iCloud Drive. Speckweg lee ese
archivo desde Windows al abrirse y al pulsar «Sincronizar».

Solo hay que montarlo una vez.

## 1. iCloud Drive en el iPhone

Ajustes → tu nombre → iCloud → iCloud Drive → activa **Sincronizar este iPhone**.
En la lista de apps que usan iCloud, comprueba que **Atajos** está activado.

## 2. iCloud en Windows

1. Instala **iCloud** desde la Microsoft Store.
2. Entra con tu cuenta de Apple y marca **iCloud Drive**.
3. Aparecerá la carpeta `iCloud Drive` en el Explorador (`C:\Users\<tú>\iCloudDrive`).

## 3. Crear el Atajo en el iPhone

Abre **Atajos** → pestaña Atajos → **+**. Ponle de nombre «Speckweg kcal» y añade estas acciones en orden:

1. **Buscar muestras de salud**
   - Toca «Tipo» y elige **Energía en actividad**.
   - Añade el filtro **Fecha de inicio** · **está en los últimos** · **2 días**.
   - Ordenar por **Fecha de inicio**, sin límite.
2. **Repetir con cada** elemento de «Muestras de salud».
3. Dentro del Repetir, la acción **Texto**, que debe quedar `Fecha de inicio;Fecha de finalización;Valor`:
   - Toca el cuadro, elige **Elemento de repetición** encima del teclado, toca la burbuja y elige **Fecha de inicio**.
   - Escribe `;`, repite con **Fecha de finalización**, escribe `;` y repite con **Valor**.
   - No hace falta cambiar el formato de las fechas: Speckweg entiende el que pone el iPhone.
4. Después de «Fin de Repetir»: **Combinar texto** con «Resultados de repetición», separador **Nueva línea**.
5. **Guardar archivo** con el «Texto combinado»:
   - Desactiva **Preguntar dónde guardar**.
   - Subruta: `Speckweg/energia.txt`
   - Activa **Sobrescribir si existe**.

Ejecútalo una vez a mano con ▶︎. La primera vez pedirá permiso para leer Salud: **Permitir**.
Tarda unos segundos porque recorre las muestras de dos días.

El archivo queda en iCloud Drive, dentro de la carpeta de Atajos. En Windows suele estar en
`C:\Users\<tú>\iCloudDrive\iCloud~is~workflow~my~workflows\Speckweg\energia.txt` (Speckweg lo busca ahí solo).

Cada línea queda así:

```
4 oct 2026, 18:30;4 oct 2026, 18:31;9,5 kcal
```

## 4. Que se ejecute solo

Atajos → pestaña **Automatización** → **+**:

- **Entrenamiento del Apple Watch** → **Al finalizar** → Ejecutar inmediatamente → «Speckweg kcal».
  Así, nada más acabar de entrenar, el archivo ya tiene las kcal.
- Opcional: **Hora del día** → 23:30, diariamente → Ejecutar inmediatamente → «Speckweg kcal».

## 5. En Speckweg

Al abrir la app y al pulsar «Sincronizar» en Hoy se lee el archivo. Cada entreno de Hevy que coincida
en hora con datos del reloj muestra «kcal del Apple Watch» en vez de la estimación.

Si no lo encuentra, ve a **Ajustes → Apple Watch**: pulsa «Leer ahora» para ver qué pasa, pon la ruta
del archivo a mano o elígelo con el botón de archivo.

## 6. Peso de la báscula

Si la app de tu báscula manda el peso a Salud, añade al final del mismo Atajo «Speckweg kcal»:

1. **Buscar muestras médicas** · Tipo **Peso** · Ordenar por **Fecha de inicio**, **Más reciente primero** · **Límite** activado, **1**.
2. **Texto**: variable «Muestras médicas» → **Fecha de inicio** (Formato de hora: **Corto**), escribe `;`, variable «Muestras médicas» → **Valor**.
3. **Guardar archivo** con ese Texto · desactiva «Preguntar dónde guardar» · Subruta `/Speckweg/peso.txt` · activa «Sobrescribir si el archivo existe».

Cada vez que se ejecuta guarda tu último peso (`5 oct 2026, 8:10;72,4 kg`). Speckweg lo añade a tu histórico al abrirse y
lo usa para la proteína, las kcal del día y las de los entrenos.

## 7. Gasto del día (reposo y actividad)

Para el balance de Hoy (kcal comidas frente a gastadas), añade al final del mismo Atajo:

1. **Buscar muestras médicas** · Tipo **Energía en reposo** · filtro **Fecha de inicio** · **está en los últimos** · **7 días** · **Agrupar por** **Día**.
2. **Repetir con cada** elemento de «Muestras médicas».
3. Dentro, **Texto**: «Ítem de repetición» → **Fecha de inicio** (Formato de hora: **Corto**), escribe `;`, «Ítem de repetición» → **Valor**.
4. Después de «Terminar repetición»: **Combinar texto** con «Resultados de repetición», separador **Nueva línea**.
5. **Guardar archivo** con el «Texto combinado» · desactiva «Preguntar dónde guardar» · Subruta `/Speckweg/reposo.txt` · activa «Sobrescribir si el archivo existe».

Repite los 5 pasos (o duplícalos) con Tipo **Energía en actividad** y Subruta `/Speckweg/actividad.txt`.
En la copia, comprueba que «Repetir con cada» usa las muestras de la segunda búsqueda.

Cada línea queda así (un día por línea): `5 oct 2026, 0:00;1650.3`. Si no encuentras «Agrupar por», funciona
igual sin agrupar: Speckweg suma las muestras de cada día. Sin `actividad.txt`, usa las de `energia.txt`.
