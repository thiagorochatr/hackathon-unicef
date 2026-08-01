// Substituto de `server-only` para os testes. Aquele pacote existe só para
// falhar quando um módulo de servidor é importado no cliente; num teste em Node
// não há cliente, e ele atrapalharia sem proteger nada.
module.exports = {};
