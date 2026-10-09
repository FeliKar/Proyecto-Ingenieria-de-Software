# language: es
Característica: Validación de datos de trámites municipales
  Como desarrollador del sistema
  quiero asegurar que las fichas de trámites sean correctas y consistentes
  para garantizar respuestas precisas a los vecinos.

  Antecedentes:
    Dado que el sistema carga las fichas desde el archivo de datos

  Esquema del escenario: Cada ficha debe tener todos los campos obligatorios
    Dada la ficha "<id_tramite>"
    Entonces debe tener el campo trámite no vacío
    Y debe tener el campo requisitos como lista no vacía
    Y debe tener el campo pasos como lista no vacía
    Y debe tener el campo vigencia no vacío
    Y debe tener el campo alias como lista no vacía
    Y debe tener el campo enlace_oficial no vacío

    Ejemplos:
      | id_tramite                      |
      | licencia-b-primera              |
      | control-o-renovaciones-licencias |
      | licencia-c-primera              |
      | licencia-d-primera              |
      | permiso-circulacion-primera     |
      | permiso-circulacion-renovacion  |

  Esquema del escenario: Los enlaces oficiales deben tener formato válido
    Dada la ficha "<id_tramite>"
    Entonces el enlace_oficial debe comenzar con "https://"

    Ejemplos:
      | id_tramite                      |
      | licencia-b-primera              |
      | control-o-renovaciones-licencias |
      | licencia-c-primera              |
      | licencia-d-primera              |
      | permiso-circulacion-primera     |
      | permiso-circulacion-renovacion  |

  Escenario: Fichas de licencia clase B primera vez
    Dada la ficha "licencia-b-primera"
    Entonces el trámite debe ser "Primera licencia clase B"
    Y debe corresponder a la clase "B"
    Y debe tener al menos un alias relacionado con "primera licencia" y "clase b"

  Escenario: Fichas de renovación/control de licencias
    Dada la ficha "control-o-renovaciones-licencias"
    Entonces el trámite debe ser "Control o renovaciones de licencias clases B, C, D y F"
    Y debe incluir las clases "B,C,D,F"
    Y debe tener aliases que incluyan "renovar"

  Escenario: Permiso de circulación - obtención
    Dada la ficha "permiso-circulacion-primera"
    Entonces el trámite debe ser "Obtención de permiso de circulación"
    Y debe tener requisitos que incluyan revisión técnica, SOAP y padrón/factura
    Y debe tener vigencia "1 año (renovable cada marzo)."

  Escenario: Permiso de circulación - renovación
    Dada la ficha "permiso-circulacion-renovacion"
    Entonces el trámite debe ser "Renovación de permiso de circulación"
    Y debe tener requisitos que incluyan permiso anterior, revisión técnica y SOAP
    Y debe tener vigencia "1 año (renovable cada marzo)."

  Escenario: No debe haber fichas duplicadas por id
    Dado el conjunto de fichas cargado
    Entonces todos los ids deben ser únicos

  Escenario: No debe haber tramites duplicados
    Dado el conjunto de fichas cargado
    Entonces todos los nombres de trámite deben ser únicos

  Escenario: Alias no deben estar vacíos
    Dado el conjunto de fichas cargado
    Entonces cada alias debe tener al menos un carácter no vacío

  Escenario: Requisitos y pasos no deben contener texto vacío
    Dado el conjunto de fichas cargado
    Entonces ningún requisito ni paso puede estar vacío