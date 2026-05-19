const PREGUNTAS = [
  {
    id:'P0', bloque:'Rompehielo', tipo:'texto-vivo',
    texto_jovial:'¿Siendo sinceros, cómo te sientes ahora mismo?',
    texto:'Expresa en una frase tu estado emocional en este momento.',
    placeholder:'Escribe cómo te sientes y presiona Enter...'
  },
  {
    id:'P1', bloque:'Tu vida académica', tipo:'unica',
    texto_jovial:'¿Cuánto tiempo pasas en la U?',
    texto:'¿Cuántas horas diarias dedicas a tu universidad de forma presencial?',
    opciones:[
      {id:'a',emoji:'🌱',label:'Solo a lo que toca', label_acad:'Menos de 4 horas'},
      {id:'b',emoji:'📖',label:'Medio tiempo', label_acad:'Entre 4 y 6 horas'},
      {id:'c',emoji:'📚',label:'Casi vivo en la U', label_acad:'Entre 6 y 8 horas'},
      {id:'d',emoji:'🔥',label:'Vivo literalmente allá', label_acad:'Más de 8 horas'}
    ]
  },
  {
    id:'P1b', bloque:'Tu vida académica', tipo:'unica',
    texto_jovial:'Y cuando llegas a tu casa... ¿cuánto le metes a los trabajos?',
    texto:'¿Cuántas horas adicionales dedicas al trabajo autónomo fuera de la universidad?',
    opciones:[
      {id:'a',emoji:'🌱',label:'Casi nada, trato de desconectar', label_acad:'Menos de 1 hora'},
      {id:'b',emoji:'📖',label:'Un rato por la noche', label_acad:'Entre 1 y 3 horas'},
      {id:'c',emoji:'📚',label:'Le sigo dando parejo', label_acad:'Entre 4 y 6 horas'},
      {id:'d',emoji:'🔥',label:'Hasta la madrugada', label_acad:'Más de 6 horas'}
    ]
  },
  {
    id:'P2', bloque:'Tu vida académica', tipo:'unica',
    texto_jovial:'Hablando claro, ¿por qué estudias Diseño Gráfico?',
    texto:'¿Cuál es tu motivación principal para cursar esta carrera?',
    opciones:[
      {id:'a',emoji:'❤️',label:'Porque me apasiona', label_acad:'Por vocación o pasión genuina'},
      {id:'b',emoji:'✨',label:'Le agarré cariño en el camino', label_acad:'Interés desarrollado en el proceso'},
      {id:'c',emoji:'😮',label:'Por obligación o mis papás', label_acad:'Por presión familiar/externa'},
      {id:'d',emoji:'🌀',label:'No sabía qué más hacer', label_acad:'Falta de orientación profesional'}
    ]
  },
  {
    id:'P3', bloque:'Tu vida académica', tipo:'unica',
    texto_jovial:'Cuando entregas un proyecto, ¿sientes que "la rompiste"?',
    texto:'¿Con qué frecuencia te sientes satisfecho/a con tus resultados académicos?',
    opciones:[
      {id:'a',emoji:'😔',label:'Casi nunca', label_acad:'Muy baja frecuencia de satisfacción'},
      {id:'b',emoji:'🤔',label:'A veces', label_acad:'Frecuencia ocasional'},
      {id:'c',emoji:'🙂',label:'Seguido', label_acad:'Alta frecuencia'},
      {id:'d',emoji:'😊',label:'Siempre', label_acad:'Constante satisfacción'}
    ]
  },
  {
    id:'P4', bloque:'Tu exigencia', tipo:'escala',
    texto_jovial:'Del 1 al 5, ¿qué tanto látigo te das con tus entregas?',
    texto:'¿Cómo describirías tu nivel de autoexigencia académica?',
    opciones:[
      {id:'1',emoji:'😌',label:'1 - Relajado/a', label_acad:'1 - Exigencia muy baja'},
      {id:'2',emoji:'🙂',label:'2 - Suave', label_acad:'2 - Exigencia baja'},
      {id:'3',emoji:'😐',label:'3 - Normal', label_acad:'3 - Exigencia moderada'},
      {id:'4',emoji:'😤',label:'4 - Duro', label_acad:'4 - Exigencia alta'},
      {id:'5',emoji:'💀',label:'5 - Soy mi peor enemigo/a', label_acad:'5 - Exigencia muy alta'}
    ]
  },
  {
    id:'P4b', bloque:'Tu exigencia', tipo:'unica',
    texto_jovial:'Esa voz que te exige tanto... ¿sabes de dónde salió?',
    texto:'¿Tienes claridad sobre el origen de tu nivel de autoexigencia?',
    opciones:[
      {id:'a',emoji:'🔦',label:'Sí, lo tengo clarísimo', label_acad:'Identifico claramente la causa'},
      {id:'b',emoji:'🌫️',label:'Tengo una ligera idea', label_acad:'Noción parcial del origen'},
      {id:'c',emoji:'😶',label:'Nunca lo he pensado', label_acad:'Ausencia de autorreflexión'},
      {id:'d',emoji:'🤷',label:'No sé, creo que así nací', label_acad:'Se percibe como rasgo innato'}
    ]
  },
  {
    id:'P5', bloque:'Tu exigencia', tipo:'unica',
    texto_jovial:'Sinceramente, ¿te consideras perfeccionista?',
    texto:'¿Te identificas a ti mismo/a como una persona perfeccionista?',
    opciones:[
      {id:'a',emoji:'💯',label:'Sí, a morir', label_acad:'Altamente perfeccionista'},
      {id:'b',emoji:'🙋',label:'Creo que sí', label_acad:'Tendencia perfeccionista'},
      {id:'c',emoji:'↕️',label:'Solo a veces', label_acad:'Perfeccionismo situacional'},
      {id:'d',emoji:'🙅',label:'No, para nada', label_acad:'No perfeccionista'}
    ]
  },
  {
    id:'P6', bloque:'Tu exigencia', tipo:'escala',
    texto_jovial:'Del 1 al 5, ¿qué tan rápido se te agota la paciencia?',
    texto:'¿Qué tan fácil o recurrente es tu nivel de frustración ante las dificultades?',
    opciones:[
      {id:'1',emoji:'🗿',label:'1 - Casi nunca', label_acad:'1 - Tolerancia muy alta'},
      {id:'2',emoji:'😏',label:'2 - Me aguanto', label_acad:'2 - Tolerancia alta'},
      {id:'3',emoji:'😬',label:'3 - Mitad y mitad', label_acad:'3 - Tolerancia moderada'},
      {id:'4',emoji:'😤',label:'4 - Rápido', label_acad:'4 - Tolerancia baja'},
      {id:'5',emoji:'🌋',label:'5 - Exploto de una', label_acad:'5 - Tolerancia muy baja'}
    ]
  },
  {
    id:'P7', bloque:'Tu exigencia', tipo:'multiple',
    texto_jovial:'Cuando el Illustrator se cierra o nada cuadra, ¿tú qué haces?',
    texto:'Cuando te enfrentas a una situación de profunda frustración, ¿cómo sueles reaccionar?',
    opciones:[
      {id:'a',emoji:'🧊',label:'Me bloqueo feo', label_acad:'Parálisis cognitiva o creativa'},
      {id:'b',emoji:'⚡',label:'Me ciego y sigo forzando', label_acad:'Sobrecompensación de esfuerzo'},
      {id:'c',emoji:'😠',label:'Me emputo / irrito muchísimo', label_acad:'Respuesta de ira / irritabilidad'},
      {id:'d',emoji:'⏳',label:'Lo dejo botado', label_acad:'Evasión de la tarea'},
      {id:'e',emoji:'🤝',label:'Pido auxilio', label_acad:'Búsqueda de apoyo externo'},
      {id:'f',emoji:'🎭',label:'Me la trago y sigo', label_acad:'Internalización de la frustración'}
    ]
  },
  {
    id:'P8', bloque:'Burnout', tipo:'unica',
    texto_jovial:'¿Has escuchado alguna vez la palabra "Burnout"?',
    texto:'¿Conoces el término "Burnout" o síndrome del estudiante quemado?',
    nota:'💡 Burnout: agotamiento físico, emocional y mental crónico por sobrecarga académica.',
    opciones:[
      {id:'a',emoji:'📚',label:'Sí, lo conozco súper bien', label_acad:'Conocimiento claro del término'},
      {id:'b',emoji:'🌫️',label:'Sí, pero no sé explicarlo', label_acad:'Noción superficial del término'},
      {id:'c',emoji:'👂',label:'Nunca lo había escuchado', label_acad:'Desconocimiento total'}
    ]
  },
  {
    id:'P9', bloque:'Burnout', tipo:'unica',
    texto_jovial:'A calzón quitado, ¿sientes que la carrera te ha "quemado"?',
    texto:'¿Sientes que has experimentado burnout en algún momento de tu proceso universitario?',
    opciones:[
      {id:'a',emoji:'💯',label:'Sí, sin duda', label_acad:'Identificación clara del síndrome'},
      {id:'b',emoji:'🤔',label:'Creo que sí', label_acad:'Sospecha de haberlo padecido'},
      {id:'c',emoji:'🌫️',label:'Solo en picos de estrés', label_acad:'Episodios agudos aislados'},
      {id:'d',emoji:'🙅',label:'No lo creo', label_acad:'No identificación con el síndrome'}
    ]
  },
  {
    id:'P10', bloque:'Burnout', tipo:'unica',
    texto_jovial:'¿Cuándo fue la última vez que te sentiste así de quemado/a?',
    texto:'¿En qué momento temporal ubicas tu última experiencia de burnout?',
    opciones:[
      {id:'a',emoji:'🔴',label:'Lo estoy viviendo ahora', label_acad:'Episodio activo / Actualidad'},
      {id:'b',emoji:'🟡',label:'El semestre pasado', label_acad:'Hace menos de seis meses'},
      {id:'c',emoji:'🟢',label:'Hace más de un año', label_acad:'Hace más de un año'},
      {id:'d',emoji:'⚪',label:'Nunca me ha pasado', label_acad:'No aplica'}
    ]
  },
  {
    id:'P11', bloque:'Burnout', tipo:'unica',
    texto_jovial:'¿Sientes que quemarte es un ciclo de cada semestre?',
    texto:'¿Consideras que el agotamiento extremo es una experiencia recurrente en tu vida académica?',
    opciones:[
      {id:'a',emoji:'🔄',label:'Sí, es un ciclo sin fin', label_acad:'Experiencia crónica o cíclica'},
      {id:'b',emoji:'❌',label:'No, fue un evento aislado', label_acad:'Experiencia puntual aislada'},
      {id:'c',emoji:'🤔',label:'No estoy seguro/a', label_acad:'Dificultad para establecer patrones'}
    ]
  },
  {
    id:'P12', bloque:'Apoyo', tipo:'unica',
    texto_jovial:'Cuando estás a punto de colapsar, ¿se lo cuentas a alguien?',
    texto:'¿Sueles verbalizar tus emociones o agotamiento mental con tu círculo social?',
    opciones:[
      {id:'a',emoji:'💬',label:'Sí, me desahogo', label_acad:'Expresión emocional habitual'},
      {id:'b',emoji:'🤫',label:'A veces, con confianza', label_acad:'Expresión selectiva / condicional'},
      {id:'c',emoji:'😶',label:'Casi nunca', label_acad:'Baja tendencia a compartir'},
      {id:'d',emoji:'🔒',label:'Prefiero tragármelo solo/a', label_acad:'Aislamiento emocional voluntario'}
    ]
  },
  {
    id:'P13', bloque:'Apoyo', tipo:'multiple',
    texto_jovial:'¿Quién es tu salvavidas cuando sientes que no puedes más?',
    texto:'En momentos de colapso emocional o académico, ¿a quién acudes en busca de apoyo?',
    opciones:[
      {id:'a',emoji:'👫',label:'Mis amigos de la U', label_acad:'Círculo de pares / compañeros'},
      {id:'b',emoji:'👨‍👩‍👧',label:'Mi familia', label_acad:'Núcleo familiar'},
      {id:'c',emoji:'💑',label:'Mi pareja', label_acad:'Relación sentimental'},
      {id:'d',emoji:'🧠',label:'Un psicólogo', label_acad:'Apoyo profesional / Terapia'},
      {id:'e',emoji:'🚫',label:'Nadie, trato de salir solo/a', label_acad:'Afrontamiento solitario'}
    ]
  },
  {
    id:'P14', bloque:'Identificación', tipo:'multiple',
    texto_jovial:'¿Cuáles de estas "red flags" 🚩 académicas te suenan familiares?',
    texto:'¿Con cuáles de las siguientes afirmaciones sobre hiperexigencia te identificas?',
    opciones:[
      {id:'a',emoji:'∞',label:'Siento que nunca es suficiente', label_acad:'Insatisfacción crónica con resultados'},
      {id:'b',emoji:'🛑',label:'No puedo parar de camellar', label_acad:'Incapacidad para desconectarse'},
      {id:'c',emoji:'💔',label:'Equivocarme me destruye', label_acad:'Baja tolerancia al error'},
      {id:'d',emoji:'👀',label:'Vivo comparándome', label_acad:'Autoevaluación basada en pares'},
      {id:'e',emoji:'😴',label:'Si descanso, siento culpa', label_acad:'Culpa asociada al ocio'},
      {id:'f',emoji:'✅',label:'Me siento en control', label_acad:'Ausencia de estos síntomas'}
    ]
  },
  {
    id:'P15', bloque:'Identificación', tipo:'unica',
    texto_jovial:'¿Qué tanto te afecta que te destruyan un proyecto?',
    texto:'¿En qué medida influyen los comentarios o valoraciones externas en tu percepción propia?',
    opciones:[
      {id:'a',emoji:'🌊',label:'Muchísimo, me ahogo', label_acad:'Alta vulnerabilidad externa'},
      {id:'b',emoji:'↕️',label:'Depende de quién venga', label_acad:'Vulnerabilidad selectiva'},
      {id:'c',emoji:'🛡️',label:'Casi nada', label_acad:'Baja vulnerabilidad externa'},
      {id:'d',emoji:'🗿',label:'Me resbala', label_acad:'Indiferencia a la crítica'}
    ]
  },
  {
    id:'P16', bloque:'Cartografía', tipo:'multiple',
    texto_jovial:'¿Qué es lo que más te exprime la cabeza en la U?',
    texto:'¿Cuáles son las situaciones o factores que te generan mayor presión universitaria?',
    opciones:[
      {id:'a',emoji:'🪨',label:'Mi propia cabeza exigiéndome', label_acad:'Presión endógena (Autoexigencia)'},
      {id:'b',emoji:'⏰',label:'La avalancha de entregas', label_acad:'Sobrecarga académica objetiva'},
      {id:'c',emoji:'👨‍👩‍👧',label:'No decepcionar a mi familia', label_acad:'Expectativas familiares'},
      {id:'d',emoji:'📊',label:'El nivel de mis compañeros', label_acad:'Competitividad entre pares'},
      {id:'e',emoji:'😰',label:'El pánico a fracasar', label_acad:'Miedo al fracaso profesional'}
    ]
  },
  {
    id:'P16b', bloque:'Cartografía', tipo:'multiple',
    texto_jovial:'¿En qué momento del semestre sientes que se te va la vida?',
    texto:'¿Durante qué etapas del semestre académico percibes mayor intensidad en tu carga mental?',
    opciones:[
      {id:'a',emoji:'🌱',label:'Desde la semana 1', label_acad:'Desde el inicio del periodo'},
      {id:'b',emoji:'📝',label:'En semana de parciales', label_acad:'Durante cortes evaluativos medios'},
      {id:'c',emoji:'🔥',label:'Cuando todo se cruza', label_acad:'En picos de carga acumulada'},
      {id:'d',emoji:'🏁',label:'En las entregas finales', label_acad:'Durante el cierre del periodo'},
      {id:'e',emoji:'📈',label:'Siempre estoy colapsado', label_acad:'Tensión constante y permanente'}
    ]
  },
  {
    id:'P17', bloque:'Cartografía', tipo:'multiple',
    texto_jovial:'Cuando tu batería está en 1%, ¿cómo reaccionas?',
    texto:'Ante el agotamiento profundo, ¿qué comportamientos o reacciones sueles manifestar?',
    opciones:[
      {id:'a',emoji:'🚪',label:'Me encierro y me aíslo', label_acad:'Aislamiento social progresivo'},
      {id:'b',emoji:'🌙',label:'Se me daña el sueño', label_acad:'Alteraciones del ritmo circadiano'},
      {id:'c',emoji:'⚡',label:'Me exijo el triple', label_acad:'Intensificación del esfuerzo (burnout activo)'},
      {id:'d',emoji:'📉',label:'Pierdo las ganas de todo', label_acad:'Apatía generalizada (burnout pasivo)'},
      {id:'e',emoji:'⏳',label:'Dejo todo para última hora', label_acad:'Procrastinación por agotamiento'}
    ]
  },
  {
    id:'P18', bloque:'Cartografía', tipo:'multiple',
    texto_jovial:'¿Cuál ha sido el costo real de estar quemado/a?',
    texto:'¿De qué manera ha afectado el agotamiento tu bienestar físico, emocional o social?',
    opciones:[
      {id:'a',emoji:'💭',label:'Ansiedad 24/7', label_acad:'Trastornos de ansiedad sostenida'},
      {id:'b',emoji:'😴',label:'Cansancio crónico', label_acad:'Agotamiento físico severo'},
      {id:'c',emoji:'🏝️',label:'Cero vida social', label_acad:'Deterioro de relaciones interpersonales'},
      {id:'d',emoji:'✏️',label:'Bloqueo creativo', label_acad:'Parálisis cognitiva o creativa'},
      {id:'e',emoji:'🔋',label:'Depresión o vacío', label_acad:'Síntomas depresivos / Sensación de vacío'}
    ]
  },
  {
    id:'P19', bloque:'Lo que no digo', tipo:'texto',
    texto_jovial:'Sinceramente, ¿hay algo de tu vida universitaria que nunca has dicho en voz alta?',
    texto:'¿Existe alguna experiencia, frustración o sentimiento académico que siempre hayas mantenido en silencio?',
    placeholder:'Escribe lo que quieras y presiona Enter... esto es 100% anónimo.'
  },
  {
    id:'P20', bloque:'Lo que no digo', tipo:'texto',
    texto_jovial:'Si tuvieras al frente a esa parte tuya que siempre te exige más, ¿qué le dirías?',
    texto:'Escribe una frase final dirigida a tu propia autoexigencia.',
    placeholder:'Una frase es suficiente. (Presiona Enter para enviar)'
  }
];

if (typeof module !== 'undefined') module.exports = PREGUNTAS;
