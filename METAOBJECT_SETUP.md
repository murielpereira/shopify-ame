# Configuração do Metaobject `pendant_image` no Shopify

## PARTE 1 — Criar a definição de Metaobject

Acesse: **Admin Shopify → Conteúdo → Metaobjetos → Adicionar definição**

### Configurações da definição:
- **Nome:** Pendant Image
- **Tipo de API:** `pendant_image`

### Campos (todos do tipo "Texto de linha única"):

| Campo        | Chave de API   | Tipo                | Obrigatório | Notas                                      |
|--------------|----------------|---------------------|-------------|--------------------------------------------|
| Formato      | `shape`        | Texto linha única   | Sim         | Valores: `osso`, `coracao`, `flor`, `circulo` |
| Material     | `material`     | Texto linha única   | Sim         | Valores: `metal`, `couro`, `metal-couro`   |
| Metal        | `metal`        | Texto linha única   | Não         | Valores: `ouro`, `prata`, `rose`, `grafite` (só para material metal/metal-couro) |
| Segunda cor  | `segunda_cor`  | Texto linha única   | Não         | Ex: `off-white`, `rosa-bebe`, `montana` (só para material couro/metal-couro) |
| URL da imagem| `image_url`    | Texto linha única   | Sim         | URL completa da foto do pingente           |

---

## PARTE 2 — Metafields já existentes (não recriar)

### No Produto:
- Namespace: `ame` | Chave: `tipo`
- Tipo: Texto linha única
- Valores válidos: `sem_pingente` | `pingente_incluso` | `pingente_opcional`

### Na Variante:
- Namespace: `custom` | Chave: `segunda_cor`
- Tipo: Texto linha única
- Valor: slug da segunda cor da coleira (ex: `off-white`, `rosa-bebe`)

---

## PARTE 3 — Exemplos de registros no metaobject

### Pingente Metal (forma: osso, metal: ouro)
```
shape: osso
material: metal
metal: ouro
segunda_cor: (vazio)
image_url: https://cdn.shopify.com/.../pingente-osso-ouro.jpg
```

### Pingente Couro (forma: coração, cor: off-white)
```
shape: coracao
material: couro
metal: (vazio)
segunda_cor: off-white
image_url: https://cdn.shopify.com/.../pingente-coracao-off-white.jpg
```

### Pingente Metal+Couro (forma: flor, metal: prata, cor: rosa-bebe)
```
shape: flor
material: metal-couro
metal: prata
segunda_cor: rosa-bebe
image_url: https://cdn.shopify.com/.../pingente-flor-prata-rosa-bebe.jpg
```

---

## PARTE 4 — Como o snippet `pendant-images-json.liquid` funciona

O snippet já está configurado corretamente. Ele lê todos os registros do metaobject
`pendant_image` e gera um JSON inline no HTML para uso pelo JavaScript:

```liquid
{%- assign pendant_entries = shop.metaobjects.pendant_image.values -%}
```

O JavaScript então busca a imagem correta com base na combinação de:
- `shape` (formato do pingente)
- `material` (metal / couro / metal-couro)
- `metal` (para materiais com metal)
- `segunda_cor` (para materiais com couro, vem da variante selecionada)