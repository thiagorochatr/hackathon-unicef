/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/custodia.json`.
 */
export type Custodia = {
  "address": "EasKv552hhhCGZEV6KS9VUENEVGEgwhMxV59W9xoRc7h",
  "metadata": {
    "name": "custodia",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Trilha de custódia e prazos da rede de proteção à infância"
  },
  "instructions": [
    {
      "name": "abrirCaso",
      "docs": [
        "Abre o caso a partir do cruzamento dos sinais.",
        "",
        "Quem assina é **quem fez o cruzamento**, não quem vai atender. O órgão",
        "responsável entra como parâmetro e não precisa concordar: o caso nasce",
        "com o relógio já correndo contra ele. Se fosse o próprio responsável a",
        "assinar a abertura, bastaria não assinar para o caso nunca existir — e",
        "aí não haveria o que cobrar depois."
      ],
      "discriminator": [
        244,
        153,
        191,
        100,
        120,
        89,
        47,
        234
      ],
      "accounts": [
        {
          "name": "caso",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  115,
                  111
                ]
              },
              {
                "kind": "arg",
                "path": "alertaId"
              }
            ]
          }
        },
        {
          "name": "emissor",
          "docs": [
            "Só quem está cadastrado como responsável pelo cruzamento pode abrir caso.",
            "A derivação do endereço a partir de `autoridade` já garante que uma",
            "instituição não consegue usar o cadastro de outra."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "autoridade"
              }
            ]
          }
        },
        {
          "name": "autoridade",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "alertaId",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "responsavel",
          "type": "pubkey"
        },
        {
          "name": "agenteHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "prazoSeg",
          "type": "i64"
        }
      ]
    },
    {
      "name": "aceitar",
      "docs": [
        "Segunda fase do repasse. Só o destino nomeado pode aceitar, e é o aceite",
        "assinado que efetivamente move a custódia."
      ],
      "discriminator": [
        89,
        59,
        100,
        214,
        250,
        161,
        248,
        109
      ],
      "accounts": [
        {
          "name": "caso",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  115,
                  111
                ]
              },
              {
                "kind": "account",
                "path": "caso.alertaId",
                "account": "caso"
              }
            ]
          }
        },
        {
          "name": "destino",
          "docs": [
            "Precisa assinar: é o aceite que move a custódia."
          ],
          "signer": true
        }
      ],
      "args": [
        {
          "name": "novoPrazoSeg",
          "type": "i64"
        },
        {
          "name": "agenteHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "adicionarCredenciados",
      "docs": [
        "Credencia profissionais e move a raiz da árvore.",
        "",
        "**O evento carrega as folhas inseridas, uma a uma.** É isso que permite",
        "a qualquer pessoa refazer a árvore inteira lendo só a cadeia e conferir",
        "que a raiz publicada bate com as folhas — ou seja, que ninguém foi",
        "enfiado no grupo às escondidas para poder denunciar sem ser da rede.",
        "",
        "Limitação declarada: o programa **não** recalcula a árvore, porque isso",
        "custaria uma travessia de Poseidon por inserção. Ele registra raiz e",
        "folhas, e a conferência é de quem quiser fazer. Recalcular on-chain está",
        "no roteiro.",
        "Uma lista de folhas **vazia** é legítima e quer dizer \"republicar a raiz",
        "sobre quem já está credenciado\". Serve para consertar o caso em que um",
        "cliente publicou uma raiz que não correspondia às folhas. Não abre",
        "brecha nova: quem administra já escolhe a raiz de qualquer jeito, e a",
        "conferência de quem audita continua a mesma — refazer a árvore a partir",
        "de todos os eventos e comparar com a raiz publicada."
      ],
      "discriminator": [
        68,
        44,
        202,
        237,
        215,
        255,
        245,
        69
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "grupo",
          "writable": true
        },
        {
          "name": "credenciador",
          "docs": [
            "Conferido dentro da instrução: ou quem administra, ou o órgão",
            "responsável do município."
          ],
          "signer": true
        }
      ],
      "args": [
        {
          "name": "folhas",
          "type": {
            "vec": {
              "array": [
                "u8",
                32
              ]
            }
          }
        },
        {
          "name": "novaRaiz",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "ancorarPeriodo",
      "docs": [
        "Ancoragem periódica obrigatória. A instituição ancora mesmo sem nenhum",
        "caso — é a **ausência** da âncora que vira alarme, porque o modo de falha",
        "dominante na rede não é falsificar registro, é não registrar."
      ],
      "discriminator": [
        166,
        190,
        29,
        37,
        195,
        51,
        21,
        203
      ],
      "accounts": [
        {
          "name": "instituicao",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "ancora",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  110,
                  99,
                  111,
                  114,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "instituicao"
              },
              {
                "kind": "arg",
                "path": "periodo"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "instituicao"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "periodo",
          "type": "u32"
        },
        {
          "name": "commitment",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "definirMp",
      "docs": [
        "Troca o endereço do Ministério Público que recebe os casos vencidos.",
        "Existe porque na vida real esse endereço muda — nova promotoria, nova",
        "chave, reorganização de comarca."
      ],
      "discriminator": [
        234,
        115,
        154,
        161,
        134,
        211,
        161,
        126
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "config"
          ]
        }
      ],
      "args": [
        {
          "name": "mp",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "escalar",
      "docs": [
        "Recusa tácita e escalonamento ao MP.",
        "",
        "**Permissionless por desenho:** não há signatário privilegiado — qualquer",
        "chave pode acionar depois de vencido o prazo. É isso que impede as partes",
        "interessadas de suprimirem a escalada simplesmente não a acionando."
      ],
      "discriminator": [
        228,
        119,
        56,
        249,
        250,
        93,
        249,
        232
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "caso",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  115,
                  111
                ]
              },
              {
                "kind": "account",
                "path": "caso.alertaId",
                "account": "caso"
              }
            ]
          }
        },
        {
          "name": "pagador",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "novoPrazoSeg",
          "type": "i64"
        }
      ]
    },
    {
      "name": "inicializar",
      "discriminator": [
        38,
        175,
        49,
        47,
        251,
        17,
        202,
        203
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "mp",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "registrarAbertura",
      "docs": [
        "Registra que o comitê abriu um veredito.",
        "",
        "O comitê tem a chave, e por isso é a parte em que mais se pede confiança.",
        "Esta instrução troca parte dessa confiança por contagem: **toda abertura",
        "que passa por aqui deixa rastro assinado**, e qualquer pessoa lê a conta",
        "sem pedir acesso a sistema nenhum — quantas vezes ele abriu, quantas",
        "viraram alerta, e quando foi a última.",
        "",
        "O que o compromisso é: um resumo do próprio envelope de veredito. Ele não",
        "serve para identificar criança nenhuma, e nem conseguiria: o veredito",
        "carrega um fator sorteado a cada avaliação, então o mesmo conjunto de",
        "sinais produz um envelope diferente — e um resumo diferente — toda vez.",
        "",
        "O que isto **não** faz, dito na cara: não impede uma abertura fora deste",
        "caminho. Para isso, comitê e nó de cruzamento precisam ser operadores",
        "diferentes, e aí o comitê pode recusar abrir o que não tiver pedido",
        "público. Aqui os dois são o mesmo processo, então o que se ganha é a",
        "contagem, não a barreira."
      ],
      "discriminator": [
        242,
        94,
        84,
        64,
        206,
        243,
        48,
        115
      ],
      "accounts": [
        {
          "name": "registro",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  98,
                  101,
                  114,
                  116,
                  117,
                  114,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "autoridade"
              }
            ]
          }
        },
        {
          "name": "emissor",
          "docs": [
            "Só quem está cadastrado para fazer o cruzamento registra abertura. A",
            "derivação a partir de `autoridade` impede um órgão de usar o cadastro",
            "de outro."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "autoridade"
              }
            ]
          }
        },
        {
          "name": "autoridade",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "compromisso",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "alerta",
          "type": "bool"
        }
      ]
    },
    {
      "name": "registrarDesfecho",
      "discriminator": [
        207,
        185,
        96,
        90,
        64,
        22,
        37,
        125
      ],
      "accounts": [
        {
          "name": "caso",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  115,
                  111
                ]
              },
              {
                "kind": "account",
                "path": "caso.alertaId",
                "account": "caso"
              }
            ]
          }
        },
        {
          "name": "custodiante",
          "signer": true,
          "relations": [
            "caso"
          ]
        }
      ],
      "args": [
        {
          "name": "desfechoHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "registrarGrupo",
      "docs": [
        "Cria o grupo de profissionais credenciados de um município, vazio.",
        "",
        "Nasce sem ninguém dentro de propósito: todo credenciado entra por",
        "`adicionar_credenciados`, e é lá que a folha dele fica registrada em",
        "evento. Se o grupo pudesse nascer já cheio, haveria um conjunto inicial",
        "que ninguém conseguiria conferir."
      ],
      "discriminator": [
        216,
        0,
        114,
        113,
        58,
        128,
        94,
        47
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "grupo",
          "writable": true
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "municipioIbge",
          "type": "u32"
        },
        {
          "name": "setor",
          "type": {
            "defined": {
              "name": "setor"
            }
          }
        },
        {
          "name": "responsavelPadrao",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "registrarInstituicao",
      "discriminator": [
        48,
        127,
        200,
        44,
        234,
        53,
        198,
        9
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "instituicao",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority"
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "tipo",
          "type": {
            "defined": {
              "name": "tipoInstituicao"
            }
          }
        },
        {
          "name": "municipioIbge",
          "type": "u32"
        },
        {
          "name": "nomeHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "registrarSinalCredenciado",
      "docs": [
        "Registra um **sinal credenciado**: um profissional prova que pertence ao",
        "setor sem dizer qual deles é, e com isso ganha o direito de emitir um",
        "sinal sobre uma criança.",
        "",
        "Repare no que esta instrução **não** faz: ela não abre caso. O caso",
        "continua nascendo só do cruzamento, quando setores diferentes convergem.",
        "O que a prova compra é o direito de entrar no cruzamento sem se",
        "identificar — a proteção é da pessoa, não do dado.",
        "",
        "E repare em quem assina: ninguém. Só quem paga a taxa, que não é órgão",
        "nenhum nem o denunciante. Quem autoriza é a prova, conferida aqui.",
        "",
        "O peso separa observação de denúncia:",
        "- **1, apontamento** — vi algo que sozinho não conclui nada;",
        "- **2, denúncia** — estou afirmando que há risco, e assumo isso.",
        "",
        "Com limiar 2, uma denúncia sozinha basta para o caso nascer, enquanto um",
        "apontamento precisa de convergência. É a diferença entre observar e",
        "afirmar, e ela existe porque quem vence o medo de denunciar não pode",
        "depender da sorte de outro setor ter registrado algo."
      ],
      "discriminator": [
        35,
        67,
        4,
        204,
        168,
        146,
        7,
        108
      ],
      "accounts": [
        {
          "name": "grupo"
        },
        {
          "name": "nulificador",
          "docs": [
            "Falha na criação se o anulador já tiver sido usado. É a proteção contra",
            "emissão repetida, e ela não precisa saber quem é ninguém."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  117,
                  108,
                  105,
                  102,
                  105,
                  99,
                  97,
                  100,
                  111,
                  114
                ]
              },
              {
                "kind": "arg",
                "path": "anulador"
              }
            ]
          }
        },
        {
          "name": "pagador",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "prova",
          "type": {
            "array": [
              "u8",
              256
            ]
          }
        },
        {
          "name": "anulador",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "periodo",
          "type": "u32"
        },
        {
          "name": "peso",
          "type": "u8"
        },
        {
          "name": "compromissoSinal",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "transferirPara",
      "docs": [
        "Primeira fase do repasse. **Não move a custódia**: o caso continua sendo",
        "de quem transferiu e o prazo segue correndo contra ele. É o que impede a",
        "responsabilidade de evaporar no encaminhamento."
      ],
      "discriminator": [
        180,
        36,
        224,
        100,
        88,
        128,
        12,
        210
      ],
      "accounts": [
        {
          "name": "caso",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  115,
                  111
                ]
              },
              {
                "kind": "account",
                "path": "caso.alertaId",
                "account": "caso"
              }
            ]
          }
        },
        {
          "name": "custodiante",
          "signer": true,
          "relations": [
            "caso"
          ]
        }
      ],
      "args": [
        {
          "name": "destino",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ancoraPeriodo",
      "discriminator": [
        191,
        86,
        46,
        34,
        128,
        77,
        127,
        139
      ]
    },
    {
      "name": "caso",
      "discriminator": [
        147,
        77,
        209,
        82,
        232,
        114,
        144,
        222
      ]
    },
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "grupoCredenciados",
      "discriminator": [
        175,
        74,
        245,
        34,
        103,
        30,
        30,
        57
      ]
    },
    {
      "name": "instituicao",
      "discriminator": [
        35,
        40,
        212,
        9,
        84,
        176,
        220,
        35
      ]
    },
    {
      "name": "nullificador",
      "discriminator": [
        134,
        218,
        231,
        188,
        223,
        17,
        172,
        232
      ]
    },
    {
      "name": "registroAberturas",
      "discriminator": [
        41,
        186,
        155,
        208,
        213,
        254,
        154,
        120
      ]
    }
  ],
  "events": [
    {
      "name": "eventoAbertura",
      "discriminator": [
        83,
        177,
        160,
        183,
        204,
        213,
        107,
        196
      ]
    },
    {
      "name": "eventoAncoragem",
      "discriminator": [
        104,
        91,
        43,
        181,
        79,
        83,
        148,
        129
      ]
    },
    {
      "name": "eventoCredenciados",
      "discriminator": [
        75,
        201,
        252,
        148,
        161,
        34,
        135,
        172
      ]
    },
    {
      "name": "eventoCustodia",
      "discriminator": [
        186,
        134,
        136,
        88,
        193,
        36,
        191,
        61
      ]
    },
    {
      "name": "eventoSinalCredenciado",
      "discriminator": [
        76,
        220,
        180,
        16,
        147,
        22,
        60,
        91
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "naoEhCustodiante",
      "msg": "Quem assina não é o custodiante atual do caso"
    },
    {
      "code": 6001,
      "name": "naoEhDestinoDoRepasse",
      "msg": "Quem assina não é o destino nomeado do repasse"
    },
    {
      "code": 6002,
      "name": "estadoIncompativel",
      "msg": "O estado atual do caso não permite esta transição"
    },
    {
      "code": 6003,
      "name": "prazoAindaVigente",
      "msg": "O prazo ainda está vigente; não há recusa tácita"
    },
    {
      "code": 6004,
      "name": "prazoInvalido",
      "msg": "Prazo inválido"
    },
    {
      "code": 6005,
      "name": "destinoInvalido",
      "msg": "Destino inválido"
    },
    {
      "code": 6006,
      "name": "periodoJaAncorado",
      "msg": "Período já ancorado por esta instituição"
    },
    {
      "code": 6007,
      "name": "casoSemDono",
      "msg": "Um caso não pode ficar sem custodiante"
    },
    {
      "code": 6008,
      "name": "naoEhComite",
      "msg": "Quem assina não está cadastrado para emitir alertas"
    },
    {
      "code": 6009,
      "name": "trilhaCheia",
      "msg": "Trilha de eventos cheia"
    },
    {
      "code": 6010,
      "name": "provaMalFormada",
      "msg": "A prova não tem o formato esperado"
    },
    {
      "code": 6011,
      "name": "provaInvalida",
      "msg": "A prova não confere"
    },
    {
      "code": 6012,
      "name": "credenciamentoLongoDemais",
      "msg": "Credenciamento com folhas demais para uma transação"
    },
    {
      "code": 6013,
      "name": "naoEhCredenciador",
      "msg": "Quem assina não pode credenciar neste município"
    },
    {
      "code": 6014,
      "name": "pesoInvalido",
      "msg": "Peso inválido: 1 para apontamento, 2 para denúncia"
    }
  ],
  "types": [
    {
      "name": "ancoraPeriodo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "instituicao",
            "type": "pubkey"
          },
          {
            "name": "periodo",
            "type": "u32"
          },
          {
            "name": "commitment",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "ts",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "caso",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "alertaId",
            "docs": [
              "Commitment opaco do alerta. Não deriva de identificador da criança."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "custodiante",
            "docs": [
              "Invariante: nunca `Pubkey::default()`."
            ],
            "type": "pubkey"
          },
          {
            "name": "pendentePara",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "agenteHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "estado",
            "type": {
              "defined": {
                "name": "estado"
              }
            }
          },
          {
            "name": "prazo",
            "type": "i64"
          },
          {
            "name": "criadoEm",
            "type": "i64"
          },
          {
            "name": "trilhaHash",
            "docs": [
              "Elo corrente da hash chain da trilha, verificável fora da cadeia."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "eventos",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "mp",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "estado",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "aberto"
          },
          {
            "name": "pendenteAceite"
          },
          {
            "name": "emAtendimento"
          },
          {
            "name": "escalado"
          },
          {
            "name": "encerrado"
          }
        ]
      }
    },
    {
      "name": "eventoAbertura",
      "docs": [
        "Cada abertura de veredito vira evento. Somado ao contador, permite conferir",
        "que o número na conta corresponde ao que de fato aconteceu."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "comite",
            "type": "pubkey"
          },
          {
            "name": "compromisso",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "alerta",
            "type": "bool"
          },
          {
            "name": "total",
            "type": "u64"
          },
          {
            "name": "ts",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "eventoAncoragem",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "instituicao",
            "type": "pubkey"
          },
          {
            "name": "periodo",
            "type": "u32"
          },
          {
            "name": "commitment",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "ts",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "eventoCredenciados",
      "docs": [
        "Toda entrada na árvore de credenciados vira evento **com as folhas**. É o",
        "que permite refazer a árvore do zero, só lendo a cadeia, e conferir que a",
        "raiz publicada corresponde exatamente a quem foi credenciado."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "municipioIbge",
            "type": "u32"
          },
          {
            "name": "folhas",
            "type": {
              "vec": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          },
          {
            "name": "raiz",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "membros",
            "type": "u32"
          },
          {
            "name": "ts",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "eventoCustodia",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "alertaId",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "tipo",
            "type": "u8"
          },
          {
            "name": "ator",
            "type": "pubkey"
          },
          {
            "name": "destino",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "estado",
            "type": {
              "defined": {
                "name": "estado"
              }
            }
          },
          {
            "name": "prazo",
            "type": "i64"
          },
          {
            "name": "trilhaHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "ts",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "eventoSinalCredenciado",
      "docs": [
        "Cada sinal credenciado deixa registro público: de que setor veio, com que",
        "peso e quando. Não diz quem emitiu nem sobre qual criança — o compromisso",
        "leva um sal aleatório justamente para não virar um identificador estável de",
        "criança na rede.",
        "",
        "Serve para duas coisas: o nó de cruzamento só aceita envelope que tenha",
        "registro aqui, o que o impede de inventar sinais; e qualquer pessoa consegue",
        "contar quantas denúncias protegidas houve por setor e período."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "municipioIbge",
            "type": "u32"
          },
          {
            "name": "setor",
            "type": {
              "defined": {
                "name": "setor"
              }
            }
          },
          {
            "name": "peso",
            "type": "u8"
          },
          {
            "name": "compromissoSinal",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "anulador",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "ts",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "grupoCredenciados",
      "docs": [
        "O grupo de profissionais credenciados de um município.",
        "",
        "Não guarda nome de ninguém: só a raiz da árvore. Saber a raiz não permite",
        "descobrir quem está dentro, e é contra ela que a prova é conferida."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "municipioIbge",
            "type": "u32"
          },
          {
            "name": "setor",
            "type": {
              "defined": {
                "name": "setor"
              }
            }
          },
          {
            "name": "raiz",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "responsavelPadrao",
            "docs": [
              "Para quem vai o caso aberto por denúncia — CREAS ou Conselho Tutelar."
            ],
            "type": "pubkey"
          },
          {
            "name": "membros",
            "docs": [
              "Quantos credenciados, só para o painel. Quanto maior, melhor o anonimato."
            ],
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "instituicao",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "tipo",
            "type": {
              "defined": {
                "name": "tipoInstituicao"
              }
            }
          },
          {
            "name": "municipioIbge",
            "type": "u32"
          },
          {
            "name": "nomeHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "ultimoPeriodoAncorado",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "nullificador",
      "docs": [
        "Marca que um anulador já foi usado.",
        "",
        "A conta em si não guarda nada de útil — o que importa é ela **existir**. O",
        "endereço dela é derivado do anulador, então criar duas vezes é impossível, e",
        "é isso que impede a mesma pessoa de denunciar repetidamente no mesmo período",
        "sem que ninguém descubra quem ela é."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "usadoEm",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "registroAberturas",
      "docs": [
        "Quantas vezes o comitê abriu um veredito, e quantas viraram alerta.",
        "",
        "Existe para ser lido por quem quiser conferir. Uma conta só, um `fetch`, sem",
        "precisar percorrer a história inteira da rede."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "comite",
            "type": "pubkey"
          },
          {
            "name": "total",
            "type": "u64"
          },
          {
            "name": "alertas",
            "type": "u64"
          },
          {
            "name": "ultima",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "setor",
      "docs": [
        "Os setores da rede de proteção que emitem sinal.",
        "",
        "A árvore de credenciados é **uma por setor, por município**. É o ponto de",
        "equilíbrio: fina o bastante para o cruzamento saber que setores diferentes",
        "convergiram, e larga o bastante para a pessoa se esconder entre todos os",
        "profissionais de saúde, de educação ou de assistência do município.",
        "",
        "Uma árvore por instituição diria de qual escola veio — e numa escola com",
        "trinta professores isso não é anonimato nenhum."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "saude"
          },
          {
            "name": "educacao"
          },
          {
            "name": "assistencia"
          }
        ]
      }
    },
    {
      "name": "tipoInstituicao",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ubs"
          },
          {
            "name": "escola"
          },
          {
            "name": "cras"
          },
          {
            "name": "creas"
          },
          {
            "name": "conselhoTutelar"
          },
          {
            "name": "mp"
          },
          {
            "name": "comite"
          }
        ]
      }
    }
  ]
};
