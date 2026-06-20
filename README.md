# CRM Pós-venda Multivisão Ótica

Aplicação instalável para acompanhar clientes durante um ano após a compra dos óculos. Funciona em uma janela própria e continua disponível sem internet após o primeiro acesso.

## Instalação no Windows

O aplicativo deve estar publicado em um endereço HTTPS. No computador da colaboradora:

1. Abra o endereço no Microsoft Edge.
2. Clique em **Instalar aplicativo** no cabeçalho.
3. Confirme a instalação.
4. Marque a opção para criar um atalho na área de trabalho, se o Windows oferecer.
5. Nas próximas vezes, abra pelo ícone **CRM Pós-venda**.

Também é possível instalar pelo menu `⋯ > Aplicativos > Instalar CRM Pós-venda`.

## Uso rápido

1. Cadastre o cliente e os dados da venda.
2. Preencha a entrega real assim que os óculos forem entregues.
3. Consulte a carteira ativa e envie a mensagem da etapa pelo WhatsApp.
4. Marque cada contato como concluído.
5. Exporte um backup ao fim de cada dia de uso.

## Funcionamento das datas

- D0 é calculado pela data da venda.
- Enquanto não houver entrega, D7 funciona como atualização da ordem de serviço.
- Após preencher a entrega real, D7, D21, 3 meses, 6 meses e 1 ano são recalculados a partir dela.
- Na ausência da entrega real, o sistema usa o prazo informado e, por último, a data da venda.

## Armazenamento e backup

Os clientes e scripts ficam no `localStorage` do navegador. Isso significa que:

- os dados não são sincronizados entre computadores por enquanto;
- outro navegador não terá acesso aos mesmos registros;
- limpar os dados do navegador pode apagar o CRM;
- o arquivo exportado deve ser guardado em local seguro, pois contém dados de clientes.

Use **Exportar dados** para criar um JSON de backup. A importação substitui os dados atuais somente após confirmação.

## Etapas do ciclo

- D0: confirmação da compra e prazo de entrega.
- D7: atualização da OS ou primeira checagem de adaptação.
- D21: segunda checagem de adaptação.
- 3 meses: limpeza e manutenção preventiva.
- 6 meses: satisfação e estado das lentes.
- 1 ano: renovação e exame.

## Publicação e desenvolvimento

O projeto usa somente HTML, CSS e JavaScript. Pode ser publicado no GitHub Pages, Cloudflare Pages, Netlify ou serviço equivalente.

### Versão publicada no Netlify

Endereço atual:

https://crm-multivisao-pos-venda.netlify.app/

A publicação inicial foi feita pelo Netlify Drop. Para atualizar manualmente:

1. Acesse o projeto no painel do Netlify.
2. Abra **Deploys**.
3. Arraste uma pasta contendo os arquivos atualizados do aplicativo para a área de publicação.
4. Aguarde a confirmação de que o deploy foi publicado.

Os dados cadastrados não são enviados ao Netlify; eles continuam armazenados localmente em cada computador.

Para testar localmente:

```bash
python3 -m http.server 8080
```

Depois, acesse `http://localhost:8080`.

O service worker mantém os arquivos principais em cache para funcionamento offline.
