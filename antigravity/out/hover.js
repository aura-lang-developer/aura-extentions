"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuraDefinitionProvider = exports.AuraHoverProvider = exports.HOVER_DATABASE = void 0;
exports.createMarkdownHover = createMarkdownHover;
exports.parseAuraSource = parseAuraSource;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const fileCache = new Map();
exports.HOVER_DATABASE = {
    // ------------------------------------------------------------------------
    // Keywords
    // ------------------------------------------------------------------------
    'fn': {
        title: 'fn',
        category: 'Keyword',
        signature: 'fn <name>(<param1>: <Type1>, ...): <ReturnType> => <Body>',
        description: 'Declara una función en Aura. Las funciones son ciudadanos de primera clase, soportan clausuras (closures), y las llamadas recursivas de cola son compiladas automáticamente con **Optimización de Llamada de Cola (TCO)** en bucles iterativos sin sobrecarga de stack.',
        params: [
            { name: 'name', type: 'Identificador', desc: 'Nombre de la función (convención camelCase).' },
            { name: 'params', type: 'param: Type, ...', desc: 'Lista de parámetros fuertemente tipados separados por comas.' },
            { name: 'ReturnType', type: 'Type', desc: 'Anotación del tipo de retorno esperado (ej. Int, String, Unit).' }
        ],
        returns: { type: 'ReturnType', desc: 'El resultado de evaluar el cuerpo de la función.' },
        example: 'fn add(a: Int, b: Int): Int => {\n    a + b\n}\n\n// Recursión de cola con TCO automático\nfn factorial(n: Int, acc: Int = 1): Int => {\n    if n <= 1 => acc\n    else => factorial(n - 1, n * acc)\n}'
    },
    'let': {
        title: 'let',
        category: 'Keyword',
        signature: 'let <name>: <Type> = <expression>;',
        description: 'Vincula una variable **inmutable** (comportamiento por defecto en Aura). Una vez asignada, una vinculación inmutable no puede ser modificada ni reasignada.',
        params: [
            { name: 'name', type: 'Identificador', desc: 'Nombre de la variable.' },
            { name: 'Type', type: 'Tipo (opcional)', desc: 'Anotación explícita. Si se omite, se infiere vía Hindley-Milner.' },
            { name: 'expression', type: 'Expresión', desc: 'Valor inicial a asignar.' }
        ],
        returns: { type: 'Unit', desc: 'Sentencia de declaración; no produce valor.' },
        example: 'let port: Int = 8080;\nlet greeting = "Hello, Aura!"; // Inferred as String'
    },
    'mut': {
        title: 'mut',
        category: 'Keyword',
        signature: 'let mut <name>: <Type> = <initial_value>;',
        description: 'Declara una vinculación de variable **mutable**. La mutabilidad debe declararse explícitamente mediante `let mut`, y la reasignación se realiza con `=`.',
        params: [
            { name: 'name', type: 'Identificador', desc: 'Nombre de la variable mutable.' },
            { name: 'Type', type: 'Tipo', desc: 'Tipo de la variable.' },
            { name: 'initial_value', type: 'Expresión', desc: 'Valor inicial previo a mutaciones.' }
        ],
        example: 'let mut count = 0;\ncount = count + 1;\nprintln(`Count: ${count}`);'
    },
    'const': {
        title: 'const',
        category: 'Keyword',
        signature: 'const <NAME>: <Type> = <constant_expression>;',
        description: 'Define una constante evaluada en tiempo de compilación con valor inmutable garantizado.',
        example: 'const MAX_CONNECTIONS: Int = 1000;\nconst API_VERSION = "v1";'
    },
    'type': {
        title: 'type',
        category: 'Keyword',
        signature: 'type <Name> = | <Variant1>(<Type>) | <Variant2>;\ntype <Name> = { <field>: <Type>, ... };',
        description: 'Declara un **Tipo de Datos Algebraico (ADT / Sum Type)**, un tipo registro/struct o un alias de tipo. Las variantes pueden portar cargas tipadas y son validadas exhaustivamente con `match`. Los registros pueden incluir struct tags en backticks.',
        params: [
            { name: 'Name', type: 'Identificador (PascalCase)', desc: 'Nombre del tipo definido por el usuario.' },
            { name: 'Variants / Fields', type: 'Definición', desc: 'Variantes separadas por `|` o campos entre llaves `{}`.' }
        ],
        example: '// Tipo Algebraico (ADT)\ntype Shape =\n    | Circle(Float)\n    | Rectangle(Float, Float)\n    | Point;\n\n// Registro con Struct Tag\ntype User = {\n    id: Int,\n    name: String,\n} `json:"user"`;'
    },
    'interface': {
        title: 'interface',
        category: 'Keyword',
        signature: 'interface <Name> {\n    fn <method>(<params>): <ReturnType>;\n}',
        description: 'Declara una **interfaz estructural** (duck typing estilo Go). Cualquier tipo que implemente todos los métodos de la interfaz la satisface implícitamente sin necesidad de `implements`.',
        params: [
            { name: 'Name', type: 'Identificador (PascalCase)', desc: 'Nombre de la interfaz.' },
            { name: 'methods', type: 'Firmas de métodos', desc: 'Métodos requeridos para satisfacer la interfaz.' }
        ],
        example: 'interface Reader {\n    fn read(size: Int): String;\n}\n\nfn dump(r: Reader): Unit => {\n    println(r.read(1024));\n}'
    },
    'struct': {
        title: 'struct',
        category: 'Keyword',
        signature: 'export struct <Name> {\n    <field1>: <Type1>,\n    <field2>: <Type2>\n};',
        description: 'Declara una estructura o registro fuertemente tipado (modelo Golang / Rust). Soporta métodos asociados con receptor por valor `fn (s: Struct) Method()` o por puntero `fn (s: *Struct) Method()`.',
        example: 'export struct BankAccount {\n    accountNumber: String,\n    balance: Float,\n    isFrozen: Bool\n};\n\nfn (b: *BankAccount) Deposit(amount: Float): Result<Float, String> => {\n    b.balance = b.balance + amount;\n    Ok(b.balance)\n}'
    },
    'packed': {
        title: 'packed',
        category: 'Keyword',
        signature: 'export packed struct <Name> {\n    <field1>: <Type1>\n};',
        description: 'Modificador de alineación para structs (modelo Zig). Garantiza cero relleno (zero padding) intermedio y distribución binaria exacta y compacta en memoria, ideal para protocolos de red, drivers y FFI C.',
        example: 'export packed struct PacketHeader {\n    magic: Int,\n    version: Byte,\n    flags: Byte,\n    payloadLength: Int\n};'
    },
    'go': {
        title: 'go',
        category: 'Keyword',
        signature: 'go {\n    <concurrent_work>\n};',
        description: 'Lanza una fibra concurrente ligera estilo Goroutine en el scheduler M:N de Aura con bajo consumo de memoria.',
        example: 'go {\n    println("Ejecutando concurrentemente en fibra");\n};'
    },
    'routine': {
        title: 'routine',
        category: 'Keyword',
        signature: 'routine {\n    <concurrent_work>\n};',
        description: 'Lanza una rutina concurrente ligera gestionada por el scheduler de fibras de Aura.',
        example: 'routine {\n    ch <- computeTask();\n};'
    },
    '//aura:build': {
        title: '//aura:build',
        category: 'Keyword',
        signature: '//aura:build <expression>\n//go:build <expression>',
        description: 'Directiva de compilación condicional colocada al inicio del archivo fuente. Permite compilar según el sistema operativo (`darwin`, `linux`, `windows`), arquitectura (`amd64`, `arm64`) o etiquetas personalizadas (`--tags "pro,metrics"`).',
        example: '//aura:build (linux && amd64) || darwin\n//aura:build pro || metrics\n\nexport fn main(): Unit => {\n    println("Compilado condicionalmente");\n}'
    },
    '//go:build': {
        title: '//go:build',
        category: 'Keyword',
        signature: '//go:build <expression>',
        description: 'Directiva de compilación condicional estilo Go compatible con el evaluador de etiquetas de Aura.',
        example: '//go:build linux || darwin'
    },
    'trait': {
        title: 'trait',
        category: 'Keyword',
        signature: 'trait <Name> {\n    fn <method>(<params>): <ReturnType>;\n}',
        description: 'Declara un contrato de comportamiento para tipos, similar a interfaces o traits de Rust.',
        example: 'trait Describable {\n    fn describe(): String;\n}'
    },
    'impl': {
        title: 'impl',
        category: 'Keyword',
        signature: 'impl <Trait> for <Type> { ... }\nimpl <Type> { ... }',
        description: 'Implementa un trait o añade métodos asociados a un tipo de datos.',
        example: 'impl Describable for User {\n    fn describe(): String => `User(${this.name})`\n}'
    },
    'match': {
        title: 'match',
        category: 'Keyword',
        signature: 'match <expression> {\n    <Pattern1> => <Branch1>,\n    <Pattern2> when <condition> => <Branch2>,\n    _ => <DefaultBranch>\n}',
        description: 'Evalúa coincidencia de patrones (pattern matching) sobre valores, tipos suma y registros. Requiere cobertura **exhaustiva** en tiempo de compilación. Soporta vinculación de variables y guardas `when`.',
        params: [
            { name: 'expression', type: 'Expresión', desc: 'Valor evaluado en el matching.' },
            { name: 'branches', type: 'Patrón => Expresión', desc: 'Brazos que manejan cada variante o valor.' }
        ],
        returns: { type: 'T', desc: 'Evalúa al resultado del brazo correspondiente ejecutado.' },
        example: 'match shape {\n    Circle(radius) when radius > 0.0 => 3.14159 * radius * radius,\n    Rectangle(w, h) => w * h,\n    Point => 0.0,\n    _ => 0.0,\n}'
    },
    'when': {
        title: 'when',
        category: 'Keyword',
        signature: '<Pattern> when <boolean_expression> => <Branch>',
        description: 'Añade una guarda condicional a un brazo de `match`. El brazo sólo se ejecuta si el patrón coincide Y la condición `when` resulta `true`.',
        example: 'match status {\n    Code(c) when c >= 200 && c < 300 => println("OK"),\n    Code(c) when c >= 400 => println("Error"),\n    _ => println("Other"),\n}'
    },
    'defer': {
        title: 'defer',
        category: 'Keyword',
        signature: 'defer <statement_or_block>;',
        description: 'Pospone la ejecución de una sentencia de limpieza hasta que la función contenedora retorne. Múltiples sentencias `defer` se ejecutan en orden determinista **LIFO (Last-In, First-Out)**. Ideal para cerrar descriptores de archivos, conexiones de base de datos y liberar mutexes.',
        example: 'let db = pg::connect("postgres://localhost:5432/db")?;\ndefer db.close();\n\nlet tx = db.beginTransaction()?;\ndefer tx.rollback();\n// do work...\ntx.commit();'
    },
    'errdefer': {
        title: 'errdefer',
        category: 'Keyword',
        signature: 'errdefer <cleanup_statement>;',
        description: 'Pospone la ejecución de una sentencia hasta el retorno de la función, pero **únicamente si ocurre un error o panic** (modelo Zig). Ideal para revertir transacciones (`tx.rollback()`).',
        example: 'let tx = db.beginTransaction()?;\nerrdefer tx.rollback();\n// Si hay error intermedio con ?, tx.rollback() se ejecuta automáticamente.'
    },
    'spawn': {
        title: 'spawn',
        category: 'Keyword',
        signature: 'spawn {\n    <work>\n};',
        description: 'Lanza una fibra concurrente ligera (**fiber**, similar a una goroutine de Go) ejecutada concurrentemente en el runtime. Las fibras se comunican de forma segura mediante canales tipados.',
        returns: { type: 'Unit', desc: 'Inicio asíncrono de la tarea concurrente.' },
        example: 'let ch = Channel<Int>::new(5);\n\nspawn {\n    for i in 1..10 {\n        ch <- i;\n    }\n};'
    },
    'select': {
        title: 'select',
        category: 'Keyword',
        signature: 'select {\n    case <msg> <- <ch> => { ... },\n    case <ch> <- <val> => { ... },\n    default => { ... }\n}',
        description: 'Multiplexa sobre múltiples operaciones de canales (envíos y recepciones). Se bloquea hasta que algún canal esté listo. Si se incluye `default`, la ejecución es no bloqueante.',
        example: 'select {\n    case msg <- ch1 => {\n        println(`Received: ${msg}`);\n    },\n    case ch2 <- "ping" => {\n        println("Sent ping");\n    },\n    default => {\n        println("No channel ready");\n    }\n}'
    },
    'case': {
        title: 'case',
        category: 'Keyword',
        signature: 'case <operacion_canal> => { ... }',
        description: 'Define una rama de comunicación dentro de una sentencia `select` sobre canales.'
    },
    'default': {
        title: 'default',
        category: 'Keyword',
        signature: 'default => { ... }',
        description: 'Rama fallback no bloqueante en sentencias `select`.'
    },
    'embed': {
        title: 'embed',
        category: 'Keyword',
        signature: 'embed("<relative_path>")',
        description: 'Incrusta un recurso de texto estático directamente dentro del binario nativo en tiempo de compilación como `String` UTF-8.',
        params: [
            { name: 'path', type: 'String Literal', desc: 'Ruta relativa al archivo de texto en disco.' }
        ],
        returns: { type: 'String', desc: 'Contenido de texto incrustado.' },
        example: 'let template = embed("./template.html");\nprintln(template);'
    },
    'embedBytes': {
        title: 'embedBytes',
        category: 'Keyword',
        signature: 'embedBytes("<relative_path>")',
        description: 'Incrusta un archivo binario estático directamente en el ejecutable en tiempo de compilación como un array de bytes (`List<Byte>`).',
        params: [
            { name: 'path', type: 'String Literal', desc: 'Ruta relativa al archivo binario.' }
        ],
        returns: { type: 'List<Byte>', desc: 'Bytes binarios incrustados.' },
        example: 'let iconData = embedBytes("./assets/logo.png");\nprintln(`Bytes loaded: ${len(iconData)}`);'
    },
    'async': {
        title: 'async',
        category: 'Keyword',
        signature: 'async fn <name>(<params>): Task<<ReturnType>, <ErrorType>> => ...',
        description: 'Marca una función o bloque como asíncrono. En Aura, las funciones asíncronas retornan un `Task<T, E>`.',
        example: 'async fn fetchData(url: String): Task<String, Error> => {\n    let resp = await http::get(url)?;\n    resp.body()\n}'
    },
    'await': {
        title: 'await',
        category: 'Keyword',
        signature: 'await <task_expression>',
        description: 'Suspende la ejecución hasta que la tarea `Task<T, E>` o promesa finaliza, desenvolviendo el valor exitoso.',
        example: 'let content = await readFile("data.json")?;'
    },
    'panic': {
        title: 'panic',
        category: 'Built-in Function',
        signature: 'panic(message: String): Never',
        description: 'Detiene la ejecución normal e inicia el desenrollado de pila con un mensaje de error fatal. Puede ser interceptado con `recover()` dentro de un bloque `defer`.',
        params: [
            { name: 'message', type: 'String', desc: 'Descripción del error fatal.' }
        ],
        returns: { type: 'Never', desc: 'No retorna normalmente; desenrolla el stack.' },
        example: 'if index >= len(items) {\n    panic("Index out of bounds!");\n}'
    },
    'recover': {
        title: 'recover',
        category: 'Built-in Function',
        signature: 'recover(): Option<Any>',
        description: 'Captura un pánico activo durante el desenrollado de pila. Retorna `Some(error)` si la fibra está en pánico, o `None` en ejecución normal. Debe invocarse dentro de un `defer`.',
        returns: { type: 'Option<Any>', desc: 'Error capturado o None.' },
        example: 'defer fn() => {\n    match recover() {\n        Some(err) => println(`Recovered from panic: ${err}`),\n        None => (),\n    }\n}();'
    },
    'if': {
        title: 'if',
        category: 'Keyword',
        signature: 'if <condition> { <ThenBranch> } else { <ElseBranch> }\nif <cond> => <ThenExpr> else => <ElseExpr>',
        description: 'Estructura condicional. En Aura, `if/else` es una expresión que produce un valor; ambas ramas deben unificar al mismo tipo.',
        example: 'let status = if score >= 90 => "A" else => "B";'
    },
    'else': {
        title: 'else',
        category: 'Keyword',
        signature: 'if <cond> { ... } else { ... }',
        description: 'Rama alternativa de una expresión condicional.'
    },
    'while': {
        title: 'while',
        category: 'Keyword',
        signature: 'while <condition> { <Body> }',
        description: 'Bucle iterativo mientras la condición evalúe a `true`. Soporta `break` y `continue` etiquetados.',
        example: 'let mut i = 0;\nwhile i < 10 {\n    println(`i: ${i}`);\n    i = i + 1;\n}'
    },
    'for': {
        title: 'for',
        category: 'Keyword',
        signature: 'for <item> in <iterable_or_channel> { <Body> }',
        description: 'Itera sobre secuencias (listas, rangos numéricos o canales CSP). Al iterar sobre un canal, recibe mensajes hasta que el canal se cierra.',
        example: '// Iteración de canal CSP\nfor val in ch {\n    println(`Received: ${val}`);\n}\n\n// Rango numérico\nfor i in 0..5 {\n    println(i);\n}'
    },
    'in': {
        title: 'in',
        category: 'Keyword',
        signature: 'for <item> in <collection>',
        description: 'Especifica la colección, rango o canal a recorrer en un bucle `for`.'
    },
    'break': {
        title: 'break',
        category: 'Keyword',
        signature: 'break; / break \'<label>;',
        description: 'Finaliza la ejecución del bucle envolvente o etiquetado.'
    },
    'continue': {
        title: 'continue',
        category: 'Keyword',
        signature: 'continue; / continue \'<label>;',
        description: 'Omite el resto de la iteración actual y pasa al siguiente ciclo del bucle.'
    },
    'return': {
        title: 'return',
        category: 'Keyword',
        signature: 'return <expression>;',
        description: 'Sale anticipadamente de la función retornando el valor especificado.'
    },
    'import': {
        title: 'import',
        category: 'Keyword',
        signature: 'import { <Symbol1>, <Symbol2 as Alias> } from "<path_or_module>";',
        description: 'Importa tipos, funciones, interfaces o valores desde otros módulos locales (`.aura`) o paquetes de la biblioteca estándar (ej. `"net/http"`). Al pasar el cursor sobre los símbolos importados o la ruta del módulo, se muestra la definición del código subyacente.',
        example: 'import { MysqlConfig, ColumnDef } from "./types";\nimport { Server, Request, Response } from "net/http";\nimport { User as AppUser } from "../models/user";'
    },
    'export': {
        title: 'export',
        category: 'Keyword',
        signature: 'export fn <name>... / export type <Name>... / export let <name>...',
        description: 'Marca declaraciones como públicas para otros módulos del proyecto y habilita su importación externa.',
        example: 'export fn main(): Unit => {\n    println("Entry point");\n}\n\nexport type Status = | Active | Inactive;'
    },
    'from': {
        title: 'from',
        category: 'Keyword',
        signature: 'import { ... } from "<path>";',
        description: 'Cláusula de origen en una sentencia `import` que especifica la ruta del módulo o archivo `.aura`.'
    },
    'as': {
        title: 'as',
        category: 'Keyword',
        signature: 'import { Original as Alias } from "<path>";',
        description: 'Crea un alias para un símbolo importado o define renombrados dentro del espacio de nombres actual.'
    },
    'module': {
        title: 'module',
        category: 'Keyword',
        signature: 'module <Namespace.Path>;',
        description: 'Define el espacio de nombres jerárquico del archivo `.aura` actual dentro del proyecto.',
        example: 'module Api.Service;\n\nexport fn handle(): Unit => ()'
    },
    // ------------------------------------------------------------------------
    // Core Types
    // ------------------------------------------------------------------------
    'Int': {
        title: 'Int',
        category: 'Type',
        signature: 'type Int',
        description: 'Entero con signo de 64 bits (`i64`). Soporta operadores aritméticos (`+`, `-`, `*`, `/`, `%`) y operadores bit a bit (`&`, `|`, `^`, `<<`, `>>`).',
        example: 'let count: Int = 42;\nlet hexValue: Int = 0xFF;'
    },
    'Float': {
        title: 'Float',
        category: 'Type',
        signature: 'type Float',
        description: 'Punto flotante IEEE 754 de 64 bits y doble precisión (`f64`).',
        example: 'let pi: Float = 3.14159265359;\nlet rate = 0.05;'
    },
    'String': {
        title: 'String',
        category: 'Type',
        signature: 'type String',
        description: 'Cadena de texto inmutable codificada en UTF-8. Soporta comillas dobles y plantillas con interpolación (`${expr}`).',
        example: 'let greeting: String = "Hello";\nlet formatted = `Value: ${greeting}`;'
    },
    'Bool': {
        title: 'Bool',
        category: 'Type',
        signature: 'type Bool = true | false',
        description: 'Tipo booleano primitivo que representa valores lógicos de verdad (`true` o `false`).',
        example: 'let isReady: Bool = true;\nlet isValid = isReady && (count > 0);'
    },
    'Unit': {
        title: 'Unit',
        category: 'Type',
        signature: 'type Unit = ()',
        description: 'Tipo unidad que denota la ausencia de un valor significativo (equivalente a `void` o tupla vacía `()`). Utilizado como retorno de funciones con efectos secundarios.',
        example: 'fn log(msg: String): Unit => {\n    println(msg);\n}'
    },
    'Byte': {
        title: 'Byte',
        category: 'Type',
        signature: 'type Byte',
        description: 'Entero sin signo de 8 bits (`0..255`). Utilizado para buffers binarios y protocolos de red.',
        example: 'let b: Byte = 255;'
    },
    'Any': {
        title: 'Any',
        category: 'Type',
        signature: 'type Any',
        description: 'Tipo dinámico que puede contener cualquier valor. Útil para interoperabilidad o estructuras polimórficas.',
        example: 'let val: Any = 123;'
    },
    'Option': {
        title: 'Option<T>',
        category: 'Type',
        signature: 'type Option<T> = | Some(T) | None',
        description: 'Representa un valor opcional sin recurrir a null o undefined: todo `Option` es o bien `Some(T)` con un valor presente, o bien `None`. Elimina los errores de puntero nulo.',
        example: 'fn findUser(id: Int): Option<User> => {\n    if id == 1 => Some(user)\n    else => None\n}\n\nmatch findUser(42) {\n    Some(u) => println(u.username),\n    None => println("User not found"),\n}'
    },
    'Some': {
        title: 'Some(v)',
        category: 'Type',
        signature: 'Some(value: T): Option<T>',
        description: 'Constructor de la variante con valor presente de `Option<T>`.'
    },
    'None': {
        title: 'None',
        category: 'Type',
        signature: 'None: Option<T>',
        description: 'Constructor de la variante vacía de `Option<T>`.'
    },
    'Result': {
        title: 'Result<T, E>',
        category: 'Type',
        signature: 'type Result<T, E> = | Ok(T) | Err(E)',
        description: 'Representa un resultado de éxito (`Ok(T)`) o de fallo (`Err(E)`). Se desenvuelve limpiamente con el operador `?` o con `match`.',
        example: 'fn divide(a: Float, b: Float): Result<Float, String> => {\n    if b == 0.0 => Err("Division by zero")\n    else => Ok(a / b)\n}\n\nlet res = divide(10.0, 2.0)?;'
    },
    'Ok': {
        title: 'Ok(v)',
        category: 'Type',
        signature: 'Ok(value: T): Result<T, E>',
        description: 'Constructor de la variante exitosa de `Result<T, E>`.'
    },
    'Err': {
        title: 'Err(e)',
        category: 'Type',
        signature: 'Err(error: E): Result<T, E>',
        description: 'Constructor de la variante de error de `Result<T, E>`.'
    },
    'Channel': {
        title: 'Channel<T>',
        category: 'Type',
        signature: 'Channel<T>::new(buffer_size: Int = 0): Channel<T>',
        description: 'Canal tipado de concurrencia CSP (estilo Go). Transporta mensajes entre fibras de forma segura. Enviar con `ch <- val`, recibir con `<-ch`. Con buffer si `buffer_size > 0`.',
        params: [
            { name: 'buffer_size', type: 'Int', desc: 'Capacidad del buffer (0 = síncrono rendezvous).' }
        ],
        returns: { type: 'Channel<T>', desc: 'Nueva instancia de canal concurrente.' },
        example: 'let ch = Channel<String>::new(10);\n\n// Send\nch <- "Hello";\n\n// Receive\nlet msg = <-ch;'
    },
    'SendChannel': {
        title: 'SendChannel<T>',
        category: 'Type',
        signature: 'type SendChannel<T>',
        description: 'Vista de canal de sólo escritura. En tiempo de compilación sólo permite operaciones de envío (`ch <- val`).'
    },
    'RecvChannel': {
        title: 'RecvChannel<T>',
        category: 'Type',
        signature: 'type RecvChannel<T>',
        description: 'Vista de canal de sólo lectura. En tiempo de compilación sólo permite operaciones de recepción (`<-ch`).'
    },
    'Task': {
        title: 'Task<T, E>',
        category: 'Type',
        signature: 'type Task<T, E>',
        description: 'Representación de cómputo asíncrono. Puede aguardarse con `await` o encadenarse.',
        example: 'let task: Task<String, Error> = http::fetch("https://api.example.com");\nlet body = await task?;'
    },
    'Context': {
        title: 'Context',
        category: 'Type',
        signature: 'Context::background() / Context::withTimeout(ctx, duration)',
        description: 'Contexto de concurrencia estructurada para propagar señales de cancelación, deadlines y valores a través de las fibras concurrentes.',
        example: 'let ctx = Context::withTimeout(Context::background(), 5000);\nlet res = await fetchWithContext(ctx, url)?;'
    },
    'WaitGroup': {
        title: 'WaitGroup',
        category: 'Type',
        signature: 'sync::WaitGroup::new(): WaitGroup',
        description: 'Primitiva de sincronización para esperar que un conjunto de fibras concurrentes terminen. Métodos: `add(n: Int)`, `done(): Unit`, `wait(): Unit`.',
        example: 'let wg = sync::WaitGroup::new();\nwg.add(1);\nspawn {\n    defer wg.done();\n    doWork();\n};\nwg.wait();'
    },
    'Mutex': {
        title: 'Mutex',
        category: 'Type',
        signature: 'sync::Mutex::new(): Mutex',
        description: 'Bloqueo de exclusión mutua. Usa `lock()` para adquirir acceso exclusivo y `unlock()` (típicamente con `defer`) para liberarlo.',
        example: 'let mu = sync::Mutex::new();\nmu.lock();\ndefer mu.unlock();\n// sección crítica'
    },
    'RWMutex': {
        title: 'RWMutex',
        category: 'Type',
        signature: 'sync::RWMutex::new(): RWMutex',
        description: 'Mutex de lectura/escritura concurrente. Permite múltiples lectores simultáneos (`rlock()` / `runlock()`) y un único escritor exclusivo (`lock()` / `unlock()`).'
    },
    'List': {
        title: 'List<T>',
        category: 'Type',
        signature: 'type List<T> = [T]',
        description: 'Colección secuencial indexada de elementos de tipo `T`. Soporta transformaciones `.map()`, `.filter()`, `.sort()` y el operador pipeline `|>`.'
    },
    'Array': {
        title: 'Array<T>',
        category: 'Type',
        signature: 'type Array<T> = [T]',
        description: 'Colección ordenada de elementos de tipo `T` (alias de `List<T>`).'
    },
    'Map': {
        title: 'Map<K, V>',
        category: 'Type',
        signature: 'Map<K, V>::new(): Map<K, V>',
        description: 'Colección asociativa clave-valor fuertemente tipada.'
    },
    'Set': {
        title: 'Set<T>',
        category: 'Type',
        signature: 'Set<T>::new(): Set<T>',
        description: 'Colección de valores únicos de tipo `T`.'
    },
    // ------------------------------------------------------------------------
    // Built-in Functions
    // ------------------------------------------------------------------------
    'println': {
        title: 'println',
        category: 'Built-in Function',
        signature: 'println(value: Any): Unit',
        description: 'Imprime la representación en texto del argumento seguida de un salto de línea en la salida estándar (`stdout`).',
        params: [
            { name: 'value', type: 'Any', desc: 'Valor o texto a imprimir.' }
        ],
        returns: { type: 'Unit', desc: 'No produce valor.' },
        example: 'println("Hello, World!");\nprintln(`Number: ${42}`);'
    },
    'print': {
        title: 'print',
        category: 'Built-in Function',
        signature: 'print(value: Any): Unit',
        description: 'Imprime el valor en `stdout` sin salto de línea posterior.'
    },
    'eprintln': {
        title: 'eprintln',
        category: 'Built-in Function',
        signature: 'eprintln(value: Any): Unit',
        description: 'Imprime en la salida de error estándar (`stderr`) con salto de línea.'
    },
    'len': {
        title: 'len',
        category: 'Built-in Function',
        signature: 'len(container: List<T> | String | Map<K, V> | Channel<T>): Int',
        description: 'Retorna el número de elementos en una lista, caracteres en una cadena, pares en un mapa o mensajes pendientes en el buffer de un canal.'
    },
    'make': {
        title: 'make',
        category: 'Built-in Function',
        signature: 'make<T>(capacity: Int): T',
        description: 'Asigna e inicializa colecciones o canales con capacidad preasignada.'
    },
    'assert': {
        title: 'assert',
        category: 'Built-in Function',
        signature: 'assert(condition: Bool, message?: String): Unit',
        description: 'Comprueba una condición; si evalúa a `false`, entra en pánico con el mensaje especificado.'
    },
    'assert_eq': {
        title: 'assert_eq',
        category: 'Built-in Function',
        signature: 'assert_eq(actual: Any, expected: Any, message?: String): Unit',
        description: 'Verifica la igualdad de dos valores. Falla con diagnóstico detallado en caso de desigualdad.'
    },
    // ------------------------------------------------------------------------
    // Native Database Drivers & Stdlib Modules
    // ------------------------------------------------------------------------
    'pg': {
        title: 'pg / postgres',
        category: 'Module',
        signature: 'pg::connect(connectionString: String): Result<PgClient, Error>',
        description: 'Driver nativo de alto rendimiento para PostgreSQL. Soporta pool de conexiones, consultas parametrizadas, transacciones y mapeo JSON automático.',
        example: 'let db = pg::connect("postgres://postgres:pass@localhost:5432/main")?;\ndefer db.close();\n\nlet rows = db.query("SELECT id, name FROM users WHERE active = $1", [true])?;'
    },
    'mysql': {
        title: 'mysql',
        category: 'Module',
        signature: 'mysql::connect(connectionString: String): Result<MySqlClient, Error>',
        description: 'Driver nativo para MySQL con prepared statements y pool de conexiones.',
        example: 'let db = mysql::connect("mysql://user:pass@localhost:3306/db")?;'
    },
    'redis': {
        title: 'redis',
        category: 'Module',
        signature: 'redis::connect(connectionString: String): Result<RedisClient, Error>',
        description: 'Cliente nativo de Redis para caché clave-valor, Pub/Sub y transacciones.',
        example: 'let client = redis::connect("redis://127.0.0.1:6379")?;\nclient.set("session:123", userJson, 3600)?;\nlet val = client.get("session:123")?;'
    },
    'http': {
        title: 'http',
        category: 'Module',
        signature: 'http.newServeMux() / http.json(res, status, data) / http.html(res, status, html)',
        description: 'Módulo web nativo para servidores HTTP y microservicios estilo Golang con soporte de middleware y enrutamiento rápido.',
        example: 'let mux = http.newServeMux();\nmux.get("/", fn(req, res) => {\n    http.html(res, 200, "<h1>Hello Aura</h1>");\n});'
    },
    'Server': {
        title: 'Server',
        category: 'Type',
        signature: 'Server.new(addr: String): Server',
        description: 'Servidor HTTP nativo de Aura. Permite registrar rutas, habilitar documentación Swagger automática (`server.enableSwagger("/swagger")`) y gestionar conexiones concurrentes.',
        example: 'import { Server, Request, Response } from "net/http";\n\nlet server = Server.new(":8080");\nserver.handle("/users", handleUser);\nserver.listen();'
    },
    'Request': {
        title: 'Request',
        category: 'Type',
        signature: 'type Request = { method: String, url: String, headers: Map<String, String>, body: String }',
        description: 'Estructura que representa la petición HTTP entrante con método, URL, encabezados y cuerpo.'
    },
    'ServeMux': {
        title: 'ServeMux',
        category: 'Type',
        signature: 'let mux = http.newServeMux();',
        description: 'Multiplexor y enrutador HTTP nativo (modelo Golang net/http). Soporta rutas dinámicas (`/api/tasks/:id`), middleware (`mux.use(...)`), y verbos HTTP (`mux.get`, `mux.post`, `mux.put`, `mux.delete`).',
        example: 'let mux = http.newServeMux();\nmux.get("/api/health", fn(req: Any, res: Any) => {\n    http.json(res, http.StatusOK, { status: "ok" });\n});'
    },
    'Error': {
        title: 'Error',
        category: 'Type',
        signature: 'type Error = String | { message: String, code?: Int }',
        description: 'Tipo de error para variantes `Err(e)` en `Result<T, E>`.',
        example: 'fn mayFail(): Result<Int, Error> => Err("Operación no permitida");'
    },
    'Never': {
        title: 'Never',
        category: 'Type',
        signature: 'type Never',
        description: 'Tipo de retorno para funciones que nunca retornan normalmente (ej. `panic()` o bucles infinitos de eventos).'
    },
    'Void': {
        title: 'Void',
        category: 'Type',
        signature: 'type Void = ()',
        description: 'Alias del tipo primitivo `Unit`.'
    },
    // ------------------------------------------------------------------------
    // Operators
    // ------------------------------------------------------------------------
    '|>': {
        title: '|>',
        category: 'Operator',
        signature: '<value> |> <function>(<extra_args>)',
        description: 'El **Operador Pipeline**. Pasa la expresión de la izquierda como primer argumento a la función de la derecha: `data |> f` equivale a `f(data)`. Permite transformaciones de datos fluidas y legibles.',
        example: 'let result = numbers\n    |> filter(fn(x) => x > 0)\n    |> map(fn(x) => x * 2)\n    |> sum();'
    },
    '<-': {
        title: '<-',
        category: 'Operator',
        signature: '<channel> <- <value> (envío)  |  <-<channel> (recepción)',
        description: 'Operador de comunicación en canales CSP. Envía un mensaje a un canal (`ch <- val`) o recibe un mensaje de un canal (`let val = <-ch`).',
        example: '// Envío\nch <- "ping";\n\n// Recepción\nlet msg = <-ch;'
    },
    '=>': {
        title: '=>',
        category: 'Operator',
        signature: 'fn(<params>): <Type> => <body>  |  <pattern> => <body>',
        description: 'Operador fat arrow. Define el cuerpo de funciones lambda y separa los brazos de patrones en `match`.',
        example: 'let double = fn(x: Int): Int => x * 2;\n\nmatch val {\n    1 => "One",\n    _ => "Other"\n}'
    },
    '?': {
        title: '?',
        category: 'Operator',
        signature: '<result_or_option_expression>?',
        description: 'Operador de propagación de errores. Si el operando es `Ok(v)` o `Some(v)`, desenvuelve el valor interno `v`. Si es `Err(e)` o `None`, retorna anticipadamente de la función.',
        example: 'let file = openFile("config.json")?;\nlet data = parseJson(file)?;'
    },
    '::': {
        title: '::',
        category: 'Operator',
        signature: '<Type>::<method_or_variant>',
        description: 'Operador de resolución de ámbito (scope). Se usa para constructores estáticos (`Channel<T>::new()`), variantes de enum (`Option::Some`), o funciones asociadas a módulos.'
    },
    '@test': {
        title: '@test',
        category: 'Decorator',
        signature: '@test\nfn test_<name>(): Unit => { ... }',
        description: 'Decorador de caso de prueba reconocido por el ejecutor `auratest`. Las funciones decoradas con `@test` se ejecutan automáticamente con aislamiento y reporte de cobertura.',
        example: '@test\nfn test_addition(): Unit => {\n    assert_eq(1 + 1, 2);\n}'
    }
};
/**
 * Builds a formatted Markdown hover card from a HoverDoc descriptor.
 */
function createMarkdownHover(doc) {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.supportHtml = true;
    // Header badge
    const badge = `**Aura ${doc.category}**`;
    md.appendMarkdown(`### ${doc.title} &nbsp; *(${badge})*\n\n`);
    // Code signature
    md.appendCodeblock(doc.signature, 'aura');
    // Origin file reference if applicable
    if (doc.fileOrigin) {
        const lineNum = (doc.lineOrigin !== undefined ? doc.lineOrigin + 1 : 1);
        const fileName = path.basename(doc.fileOrigin);
        md.appendMarkdown(`📁 *Definido en:* [\`${fileName}:${lineNum}\`](file://${doc.fileOrigin}#L${lineNum})\n\n`);
    }
    // Description
    if (doc.description) {
        md.appendMarkdown(`${doc.description}\n\n`);
    }
    // Parameters table
    if (doc.params && doc.params.length > 0) {
        md.appendMarkdown(`---\n#### 📥 Parámetros / Entrada\n`);
        for (const p of doc.params) {
            md.appendMarkdown(`* **\`${p.name}\`** (\`${p.type}\`): ${p.desc}\n`);
        }
        md.appendMarkdown(`\n`);
    }
    // Record Fields table
    if (doc.fields && doc.fields.length > 0) {
        md.appendMarkdown(`---\n#### 📋 Campos del Registro\n`);
        for (const f of doc.fields) {
            const tagStr = f.tag ? ` *(tag: \`${f.tag}\`)*` : '';
            md.appendMarkdown(`* **\`${f.name}\`**: \`${f.type}\`${tagStr}${f.desc ? ` — ${f.desc}` : ''}\n`);
        }
        md.appendMarkdown(`\n`);
    }
    // Variants table for ADT
    if (doc.variants && doc.variants.length > 0) {
        md.appendMarkdown(`---\n#### 🔀 Variantes (Sum Type / ADT)\n`);
        for (const v of doc.variants) {
            md.appendMarkdown(`* **\`${v.name}\`**${v.desc ? ` — ${v.desc}` : ''}\n`);
        }
        md.appendMarkdown(`\n`);
    }
    // Return value
    if (doc.returns) {
        md.appendMarkdown(`---\n#### 📤 Retorno / Tipo Resultante\n`);
        md.appendMarkdown(`* **Tipo:** \`${doc.returns.type}\`\n`);
        md.appendMarkdown(`* **Detalle:** ${doc.returns.desc}\n\n`);
    }
    // Code Example
    if (doc.example) {
        md.appendMarkdown(`---\n#### 💡 Ejemplo de Código\n`);
        md.appendCodeblock(doc.example, 'aura');
    }
    // Pro Tips
    if (doc.tips) {
        md.appendMarkdown(`---\n> **💡 Tip:** ${doc.tips}\n\n`);
    }
    return new vscode.Hover(md);
}
/**
 * Extracts preceding documentation comments (triple-slash lines `/// ...`)
 */
function extractDocComments(lines, targetLineIdx) {
    const docLines = [];
    let idx = targetLineIdx - 1;
    while (idx >= 0) {
        const line = lines[idx].trim();
        if (line.startsWith('///')) {
            docLines.unshift(line.replace(/^\/\/\/\s?/, ''));
            idx--;
        }
        else if (line === '' || line.startsWith('@')) {
            // Permit empty lines or decorators directly above
            idx--;
        }
        else {
            break;
        }
    }
    return docLines.length > 0 ? docLines.join('\n') : undefined;
}
/**
 * Parses an Aura document and extracts functions, types, interfaces, variables, and imports.
 */
function parseAuraSource(content, filePath) {
    const symbols = new Map();
    const imports = [];
    const lines = content.split(/\r?\n/);
    // 1. Parse Imports (including multiline import statements)
    const importRegex = /import\s*\{([\s\S]*?)\}\s*from\s*["']([^"']+)["']/g;
    let importMatch;
    while ((importMatch = importRegex.exec(content)) !== null) {
        const rawItems = importMatch[1];
        const sourcePath = importMatch[2];
        const matchPos = importMatch.index;
        const lineNum = content.substring(0, matchPos).split('\n').length - 1;
        const specifiers = rawItems.split(',');
        for (const raw of specifiers) {
            const trimmed = raw.trim();
            if (!trimmed)
                continue;
            const asMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s+as\s+([a-zA-Z_][a-zA-Z0-9_]*)$/);
            if (asMatch) {
                const name = asMatch[1];
                const alias = asMatch[2];
                imports.push({ name, alias, source: sourcePath, line: lineNum });
                symbols.set(alias, {
                    name: alias,
                    kind: 'import',
                    signature: `import { ${name} as ${alias} } from "${sourcePath}";`,
                    line: lineNum,
                    rawSnippet: `import { ${name} as ${alias} } from "${sourcePath}";`,
                    sourceFile: filePath
                });
            }
            else {
                const nameMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)$/);
                if (nameMatch) {
                    const name = nameMatch[1];
                    imports.push({ name, source: sourcePath, line: lineNum });
                    symbols.set(name, {
                        name,
                        kind: 'import',
                        signature: `import { ${name} } from "${sourcePath}";`,
                        line: lineNum,
                        rawSnippet: `import { ${name} } from "${sourcePath}";`,
                        sourceFile: filePath
                    });
                }
            }
        }
    }
    // 2. Line-by-line parser for functions, types, interfaces, and let bindings
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Structs: (export)? (packed)? struct Name { ... }
        const structMatch = line.match(/^\s*(export\s+)?(packed\s+)?struct\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:<[^>]+>)?\s*\{?/);
        if (structMatch) {
            const isExport = Boolean(structMatch[1]);
            const isPacked = Boolean(structMatch[2]);
            const name = structMatch[3];
            const doc = extractDocComments(lines, i);
            let j = i;
            let fullStruct = '';
            while (j < lines.length) {
                fullStruct += lines[j] + '\n';
                if (lines[j].includes('}') || lines[j].includes('};'))
                    break;
                j++;
            }
            const fields = [];
            const fieldMatches = fullStruct.matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,\n}]+)/g);
            for (const fm of fieldMatches) {
                fields.push({ name: fm[1].trim(), type: fm[2].trim() });
            }
            const prefix = `${isExport ? 'export ' : ''}${isPacked ? 'packed ' : ''}`;
            const signature = `${prefix}struct ${name} { ... }`;
            symbols.set(name, {
                name,
                kind: 'type',
                signature,
                docComment: doc,
                line: i,
                rawSnippet: fullStruct.trim(),
                fields,
                sourceFile: filePath
            });
            continue;
        }
        // Method Receivers: (export)? (async)? fn (recv: *Type) MethodName(params): ReturnType
        const recvMatch = line.match(/^\s*(export\s+)?(async\s+)?fn\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(\*?\s*[a-zA-Z_][a-zA-Z0-9_]*(?:<[^>]+>)?)\s*\)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)(?:\s*:\s*([^=>{]+))?/);
        if (recvMatch) {
            const isExport = Boolean(recvMatch[1]);
            const isAsync = Boolean(recvMatch[2]);
            const recvName = recvMatch[3];
            const recvType = recvMatch[4].replace(/\s+/g, '');
            const methodName = recvMatch[5];
            const rawParams = recvMatch[6];
            const returnType = (recvMatch[7] || 'Unit').trim();
            const doc = extractDocComments(lines, i);
            const paramsList = [
                { name: recvName, type: recvType, desc: 'Receptor del método (struct receiver).' }
            ];
            if (rawParams.trim()) {
                const parts = rawParams.split(',');
                for (const p of parts) {
                    const colonIdx = p.indexOf(':');
                    if (colonIdx > -1) {
                        const pName = p.substring(0, colonIdx).trim();
                        const pType = p.substring(colonIdx + 1).trim();
                        paramsList.push({ name: pName, type: pType, desc: 'Parámetro del método.' });
                    }
                }
            }
            const prefix = `${isExport ? 'export ' : ''}${isAsync ? 'async ' : ''}`;
            const signature = `${prefix}fn (${recvName}: ${recvType}) ${methodName}(${rawParams}): ${returnType}`;
            symbols.set(methodName, {
                name: methodName,
                kind: 'function',
                signature,
                docComment: doc,
                line: i,
                rawSnippet: signature,
                params: paramsList,
                returns: { type: returnType, desc: 'Resultado de la invocación del método.' },
                sourceFile: filePath
            });
            const cleanTypeName = recvType.replace(/^\*/, '');
            symbols.set(`${cleanTypeName}.${methodName}`, {
                name: `${cleanTypeName}.${methodName}`,
                kind: 'function',
                signature,
                docComment: doc,
                line: i,
                rawSnippet: signature,
                params: paramsList,
                returns: { type: returnType, desc: 'Resultado de la invocación del método.' },
                sourceFile: filePath
            });
            continue;
        }
        // Functions: (export)? (async)? fn name(params): ReturnType
        const fnMatch = line.match(/^\s*(export\s+)?(async\s+)?fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)(?:\s*:\s*([^=>{]+))?/);
        if (fnMatch) {
            const isExport = Boolean(fnMatch[1]);
            const isAsync = Boolean(fnMatch[2]);
            const name = fnMatch[3];
            const rawParams = fnMatch[4];
            const returnType = (fnMatch[5] || 'Unit').trim();
            const doc = extractDocComments(lines, i);
            const paramsList = [];
            if (rawParams.trim()) {
                const parts = rawParams.split(',');
                for (const p of parts) {
                    const colonIdx = p.indexOf(':');
                    if (colonIdx > -1) {
                        const pName = p.substring(0, colonIdx).trim();
                        const pType = p.substring(colonIdx + 1).trim();
                        paramsList.push({ name: pName, type: pType, desc: `Parámetro de entrada tipado.` });
                    }
                    else if (p.trim()) {
                        paramsList.push({ name: p.trim(), type: 'Any', desc: 'Parámetro de entrada.' });
                    }
                }
            }
            const prefix = `${isExport ? 'export ' : ''}${isAsync ? 'async ' : ''}`;
            const signature = `${prefix}fn ${name}(${rawParams}): ${returnType}`;
            symbols.set(name, {
                name,
                kind: 'function',
                signature,
                docComment: doc,
                line: i,
                rawSnippet: signature,
                params: paramsList,
                returns: { type: returnType, desc: 'Resultado de la evaluación de la función.' },
                sourceFile: filePath
            });
            continue;
        }
        // Types: (export)? type Name = ...
        const typeMatch = line.match(/^\s*(export\s+)?type\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:<[^>]+>)?\s*=\s*(.*)/);
        if (typeMatch) {
            const isExport = Boolean(typeMatch[1]);
            const name = typeMatch[2];
            let typeBody = typeMatch[3].trim();
            const doc = extractDocComments(lines, i);
            const fields = [];
            const variants = [];
            let snippet = `${isExport ? 'export ' : ''}type ${name} = ${typeBody}`;
            // Check if record type (starts with {)
            if (typeBody.startsWith('{')) {
                // Collect lines until closing }
                let j = i;
                let fullRecord = '';
                while (j < lines.length) {
                    fullRecord += lines[j] + '\n';
                    if (lines[j].includes('}'))
                        break;
                    j++;
                }
                // Extract fields
                const fieldMatches = fullRecord.matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,\n}]+)/g);
                for (const fm of fieldMatches) {
                    fields.push({ name: fm[1].trim(), type: fm[2].trim() });
                }
                // Check struct tags `json:"..."`
                const tagMatch = fullRecord.match(/`([^`]+)`/);
                const tagStr = tagMatch ? tagMatch[1] : undefined;
                snippet = fullRecord.trim();
                symbols.set(name, {
                    name,
                    kind: 'type',
                    signature: `type ${name} = { ... }${tagStr ? ` \`${tagStr}\`` : ''}`,
                    docComment: doc,
                    line: i,
                    rawSnippet: snippet,
                    fields,
                    sourceFile: filePath
                });
            }
            else {
                // Check if ADT (variants separated by |)
                let j = i;
                let fullAdt = '';
                while (j < lines.length) {
                    fullAdt += lines[j] + '\n';
                    if (lines[j].includes(';') || (j > i && lines[j].trim() === ''))
                        break;
                    j++;
                }
                const varMatches = fullAdt.matchAll(/\|\s*([A-Z][a-zA-Z0-9_]*(?:\([^)]*\))?)/g);
                for (const vm of varMatches) {
                    variants.push({ name: vm[1].trim() });
                }
                snippet = fullAdt.trim();
                symbols.set(name, {
                    name,
                    kind: 'type',
                    signature: `type ${name} = ${variants.map(v => '| ' + v.name).join(' ') || typeBody}`,
                    docComment: doc,
                    line: i,
                    rawSnippet: snippet,
                    variants: variants.length > 0 ? variants : undefined,
                    sourceFile: filePath
                });
            }
            continue;
        }
        // Interfaces: (export)? (interface|trait) Name { ... }
        const ifaceMatch = line.match(/^\s*(export\s+)?(interface|trait)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\{/);
        if (ifaceMatch) {
            const isExport = Boolean(ifaceMatch[1]);
            const kindWord = ifaceMatch[2];
            const name = ifaceMatch[3];
            const doc = extractDocComments(lines, i);
            let j = i;
            let fullIface = '';
            while (j < lines.length) {
                fullIface += lines[j] + '\n';
                if (lines[j].includes('}'))
                    break;
                j++;
            }
            symbols.set(name, {
                name,
                kind: 'interface',
                signature: `${isExport ? 'export ' : ''}${kindWord} ${name} { ... }`,
                docComment: doc,
                line: i,
                rawSnippet: fullIface.trim(),
                sourceFile: filePath
            });
            continue;
        }
        // Variables: let (mut)? name (: Type)? =
        const letMatch = line.match(/^\s*(export\s+)?let\s+(mut\s+)?([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*:\s*([^=;]+))?\s*=/);
        if (letMatch) {
            const isExport = Boolean(letMatch[1]);
            const isMut = Boolean(letMatch[2]);
            const name = letMatch[3];
            const typeAnn = letMatch[4] ? letMatch[4].trim() : undefined;
            const doc = extractDocComments(lines, i);
            const sig = `${isExport ? 'export ' : ''}let ${isMut ? 'mut ' : ''}${name}${typeAnn ? ': ' + typeAnn : ''}`;
            symbols.set(name, {
                name,
                kind: 'variable',
                signature: sig,
                docComment: doc,
                line: i,
                rawSnippet: line.trim(),
                sourceFile: filePath
            });
            continue;
        }
    }
    return {
        mtime: Date.now(),
        symbols,
        imports
    };
}
/**
 * Retrieves the cached or freshly parsed document state for a file path.
 */
function getDocumentCache(filePath, textOverride) {
    try {
        if (!fs.existsSync(filePath) && textOverride === undefined) {
            return undefined;
        }
        let mtime = 0;
        if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            mtime = stat.mtimeMs;
        }
        const cached = fileCache.get(filePath);
        if (cached && cached.mtime === mtime && textOverride === undefined) {
            return cached;
        }
        const content = textOverride !== undefined ? textOverride : fs.readFileSync(filePath, 'utf-8');
        const parsed = parseAuraSource(content, filePath);
        parsed.mtime = mtime;
        fileCache.set(filePath, parsed);
        return parsed;
    }
    catch {
        return undefined;
    }
}
/**
 * Resolves a module path (e.g. "./types", "../models/user") to an absolute disk path.
 */
function resolveModuleFilePath(currentFilePath, modulePath) {
    const dir = path.dirname(currentFilePath);
    const candidates = [
        path.resolve(dir, modulePath),
        path.resolve(dir, modulePath + '.aura'),
        path.resolve(dir, modulePath, 'index.aura'),
        path.resolve(dir, modulePath, 'mod.aura'),
        path.resolve(dir, modulePath, 'types.aura')
    ];
    for (const cand of candidates) {
        if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
            return cand;
        }
    }
    return undefined;
}
/**
 * Resolves an imported symbol to its underlying definition in the imported file.
 */
function resolveUnderlyingImport(document, symbolName) {
    const currentDoc = getDocumentCache(document.fileName, document.getText());
    if (!currentDoc)
        return undefined;
    // Find if the symbol is in the current document's import declarations
    const imp = currentDoc.imports.find(i => (i.alias ? i.alias === symbolName : i.name === symbolName));
    if (!imp)
        return undefined;
    const originalSymbolName = imp.name;
    const sourceModule = imp.source;
    // Relative file import (starts with . or /)
    if (sourceModule.startsWith('.') || sourceModule.startsWith('/')) {
        const resolvedPath = resolveModuleFilePath(document.fileName, sourceModule);
        if (resolvedPath) {
            const targetDoc = getDocumentCache(resolvedPath);
            if (targetDoc) {
                const targetSym = targetDoc.symbols.get(originalSymbolName);
                if (targetSym) {
                    const fileName = path.basename(resolvedPath);
                    const kindBadge = targetSym.kind === 'function' ? 'Función' :
                        targetSym.kind === 'type' ? 'Tipo / Estructura' :
                            targetSym.kind === 'interface' ? 'Interfaz' : 'Variable';
                    return {
                        title: `${imp.alias ? imp.alias + ' (original: ' + originalSymbolName + ')' : originalSymbolName}`,
                        category: 'Imported Symbol',
                        signature: targetSym.rawSnippet || targetSym.signature,
                        description: `Símbolo **${originalSymbolName}** importado desde el módulo \`${sourceModule}\`.\n\n` +
                            (targetSym.docComment ? `### 📝 Documentación:\n${targetSym.docComment}\n\n` : ''),
                        params: targetSym.params,
                        returns: targetSym.returns,
                        fields: targetSym.fields,
                        variants: targetSym.variants,
                        fileOrigin: resolvedPath,
                        lineOrigin: targetSym.line,
                        tips: `Definido en el código subyacente de \`${fileName}\`. Haz Ctrl+Click o F12 para ir a la definición.`
                    };
                }
            }
        }
    }
    // Standard Library Module check (e.g. "net/http", "sync", "time")
    const stdKey = `${sourceModule}::${originalSymbolName}`;
    const directStd = exports.HOVER_DATABASE[originalSymbolName] || exports.HOVER_DATABASE[stdKey];
    if (directStd) {
        return {
            ...directStd,
            category: 'Imported Symbol',
            tips: `Importado desde la biblioteca estándar de Aura (\`${sourceModule}\`).`
        };
    }
    return undefined;
}
/**
 * Creates hover description for hovering over module path string literals like "net/http" or "./types".
 */
function getModulePathHover(document, modulePath) {
    // Relative file import
    if (modulePath.startsWith('.') || modulePath.startsWith('/')) {
        const resolved = resolveModuleFilePath(document.fileName, modulePath);
        if (resolved) {
            const targetDoc = getDocumentCache(resolved);
            const exportsList = [];
            if (targetDoc) {
                for (const [sName, sInfo] of targetDoc.symbols.entries()) {
                    if (sInfo.kind !== 'import') {
                        exportsList.push(`* **\`${sName}\`** (${sInfo.kind}): \`${sInfo.signature}\``);
                    }
                }
            }
            const fileName = path.basename(resolved);
            const fileSize = fs.statSync(resolved).size;
            return {
                title: `Módulo Local: "${modulePath}"`,
                category: 'Module',
                signature: `import { ... } from "${modulePath}";`,
                description: `Módulo de código fuente Aura local resuelto en el disco.\n\n` +
                    `* **Archivo:** \`${fileName}\` (${fileSize} bytes)\n` +
                    `* **Ruta absoluta:** \`${resolved}\`\n\n` +
                    (exportsList.length > 0
                        ? `#### 📤 Símbolos declarados en este módulo:\n${exportsList.join('\n')}`
                        : '*No se encontraron símbolos públicos exportados.*'),
                fileOrigin: resolved,
                lineOrigin: 0,
                tips: `Usa \`import { Symbol } from "${modulePath}"\` para utilizar sus tipos y funciones.`
            };
        }
        else {
            return {
                title: `Módulo Local no encontrado: "${modulePath}"`,
                category: 'Module',
                signature: `import { ... } from "${modulePath}";`,
                description: `⚠️ El archivo correspondiente al módulo \`${modulePath}\` no fue encontrado en las rutas relativas exploradas.`,
                tips: 'Asegúrate de que el archivo existe con extensión `.aura`.'
            };
        }
    }
    // Standard Library Module Descriptions
    const STDLIB_MODULES = {
        'net/http': {
            title: 'net/http',
            category: 'Module',
            signature: 'import { Server, Request, Response, newServeMux } from "net/http";',
            description: 'Biblioteca HTTP estándar nativa de Aura inspirada en Golang `net/http`. Proporciona servidor HTTP de alta concurrencia por fibras, multiplexor de rutas (`ServeMux`), generador OpenAPI/Swagger y constructores JSON/HTML de respuesta.',
            example: 'import { Server, Request, Response } from "net/http";\n\nlet server = Server.new(":8080");\nserver.handle("/api/users", fn(req: Request): Response => {\n    Response.json({ status: "ok" })\n});'
        },
        'sync': {
            title: 'sync',
            category: 'Module',
            signature: 'import { WaitGroup, Mutex, RWMutex, Once } from "sync";',
            description: 'Primitivas fundamentales de sincronización para concurrencia de fibras CSP. Incluye `WaitGroup` para esperar grupos de tareas, `Mutex` para exclusión mutua y `Once` para inicialización única de recursos.',
            example: 'import { WaitGroup, Mutex } from "sync";\n\nlet wg = WaitGroup.new();\nwg.add(2);'
        },
        'time': {
            title: 'time',
            category: 'Module',
            signature: 'import { now, sleep, since, Duration } from "time";',
            description: 'Operaciones temporales, duraciones, timers, y sleep no bloqueante para fibras Aura.',
            example: 'import { sleep } from "time";\nsleep(1000); // 1 segundo'
        },
        'json': {
            title: 'json',
            category: 'Module',
            signature: 'import { parse, stringify } from "json";',
            description: 'Codificación y decodificación ultrarrápida de objetos y estructuras JSON con compatibilidad de struct tags.',
            example: 'import { stringify, parse } from "json";\nlet s = stringify(user);'
        },
        'math': {
            title: 'math',
            category: 'Module',
            signature: 'import { sin, cos, sqrt, PI, floor, ceil } from "math";',
            description: 'Funciones matemáticas estándar y constantes de punto flotante de alta precisión.'
        },
        'io': {
            title: 'io',
            category: 'Module',
            signature: 'import { readFile, writeFile, openFile, Reader } from "io";',
            description: 'Operaciones de entrada/salida para el sistema de archivos y streams binarios.'
        },
        'os': {
            title: 'os',
            category: 'Module',
            signature: 'import { args, env, exit, getenv } from "os";',
            description: 'Acceso al entorno del sistema operativo, variables de entorno y argumentos de línea de comandos.'
        }
    };
    if (STDLIB_MODULES[modulePath]) {
        return STDLIB_MODULES[modulePath];
    }
    return undefined;
}
/**
 * Rich Contextual Hover Provider for Aura Language.
 * Supports:
 * 1. Underlying code extraction for imported symbols (`import { X } from "./module"`).
 * 2. Module exploration when hovering over import strings (`"net/http"` or `"./types"`).
 * 3. Local functions, types, interfaces, and variables with signatures and doc comments (`///`).
 * 4. Comprehensive catalog of Aura language keywords, operators, core types, and stdlib.
 */
class AuraHoverProvider {
    provideHover(document, position, _token) {
        const lineText = document.lineAt(position.line).text;
        // 1. Check if hovering over a module path string literal in an import statement
        const moduleStringRange = document.getWordRangeAtPosition(position, /["'][^"']+["']/);
        if (moduleStringRange && (lineText.includes('import') || lineText.includes('from'))) {
            const rawQuoted = document.getText(moduleStringRange);
            const modulePath = rawQuoted.replace(/^["']|["']$/g, '');
            const modDoc = getModulePathHover(document, modulePath);
            if (modDoc) {
                return createMarkdownHover(modDoc);
            }
        }
        // 2. Extract word/token under cursor
        const range = document.getWordRangeAtPosition(position, /@[a-zA-Z_][a-zA-Z0-9_]*|\b[a-zA-Z_][a-zA-Z0-9_]*\b|\|>|<-|->|=>|\?|::/);
        if (!range) {
            return undefined;
        }
        const word = document.getText(range);
        // 3. Check if hovering over an imported symbol (resolves underlying file code!)
        const importedDoc = resolveUnderlyingImport(document, word);
        if (importedDoc) {
            return createMarkdownHover(importedDoc);
        }
        // 4. Check if symbol is defined locally in the current document
        const currentDoc = getDocumentCache(document.fileName, document.getText());
        if (currentDoc) {
            const localSym = currentDoc.symbols.get(word);
            if (localSym && localSym.kind !== 'import') {
                const kindBadge = localSym.kind === 'function' ? 'Función Local' :
                    localSym.kind === 'type' ? 'Tipo / Estructura Local' :
                        localSym.kind === 'interface' ? 'Interfaz Local' : 'Variable Local';
                const localDoc = {
                    title: localSym.name,
                    category: 'Local Symbol',
                    signature: localSym.rawSnippet || localSym.signature,
                    description: localSym.docComment
                        ? `### 📝 Documentación:\n${localSym.docComment}\n\n`
                        : `Definición de **${localSym.name}** en este archivo.`,
                    params: localSym.params,
                    returns: localSym.returns,
                    fields: localSym.fields,
                    variants: localSym.variants,
                    fileOrigin: document.fileName,
                    lineOrigin: localSym.line
                };
                return createMarkdownHover(localDoc);
            }
        }
        // 5. Check static database for keywords, operators, core types, and stdlib
        const staticDoc = exports.HOVER_DATABASE[word];
        if (staticDoc) {
            return createMarkdownHover(staticDoc);
        }
        return undefined;
    }
}
exports.AuraHoverProvider = AuraHoverProvider;
/**
 * Definition Provider enabling Go to Definition (F12 / Cmd+Click)
 * to jump directly into underlying code in imported .aura files or local definitions.
 */
class AuraDefinitionProvider {
    provideDefinition(document, position, _token) {
        const lineText = document.lineAt(position.line).text;
        // 1. Check if clicking on module path string (e.g. "./types")
        const moduleStringRange = document.getWordRangeAtPosition(position, /["'][^"']+["']/);
        if (moduleStringRange && (lineText.includes('import') || lineText.includes('from'))) {
            const rawQuoted = document.getText(moduleStringRange);
            const modulePath = rawQuoted.replace(/^["']|["']$/g, '');
            if (modulePath.startsWith('.') || modulePath.startsWith('/')) {
                const resolved = resolveModuleFilePath(document.fileName, modulePath);
                if (resolved) {
                    return new vscode.Location(vscode.Uri.file(resolved), new vscode.Position(0, 0));
                }
            }
        }
        // 2. Extract word under cursor
        const range = document.getWordRangeAtPosition(position, /\b[a-zA-Z_][a-zA-Z0-9_]*\b/);
        if (!range)
            return undefined;
        const word = document.getText(range);
        // 3. Check imported symbol
        const currentDoc = getDocumentCache(document.fileName, document.getText());
        if (currentDoc) {
            const imp = currentDoc.imports.find(i => (i.alias ? i.alias === word : i.name === word));
            if (imp && (imp.source.startsWith('.') || imp.source.startsWith('/'))) {
                const resolvedPath = resolveModuleFilePath(document.fileName, imp.source);
                if (resolvedPath) {
                    const targetDoc = getDocumentCache(resolvedPath);
                    if (targetDoc) {
                        const targetSym = targetDoc.symbols.get(imp.name);
                        if (targetSym) {
                            return new vscode.Location(vscode.Uri.file(resolvedPath), new vscode.Position(targetSym.line, 0));
                        }
                    }
                    return new vscode.Location(vscode.Uri.file(resolvedPath), new vscode.Position(0, 0));
                }
            }
            // 4. Check local symbol
            const localSym = currentDoc.symbols.get(word);
            if (localSym && localSym.kind !== 'import') {
                return new vscode.Location(document.uri, new vscode.Position(localSym.line, 0));
            }
        }
        return undefined;
    }
}
exports.AuraDefinitionProvider = AuraDefinitionProvider;
//# sourceMappingURL=hover.js.map