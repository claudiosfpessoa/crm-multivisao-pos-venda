# CRM Pós-venda Multivisão Ótica

Aplicação local para acompanhar clientes durante um ano após a compra dos óculos. Não exige instalação, servidor ou conexão com banco de dados.

## Uso rápido

1. Abra o arquivo `index.html` em um navegador moderno.
2. Cadastre o cliente e os dados da venda.
3. Preencha a entrega real assim que os óculos forem entregues.
4. Consulte a carteira ativa e envie a mensagem da etapa pelo WhatsApp.
5. Marque cada contato como concluído.
6. Exporte um backup ao fim de cada dia de uso.

## Funcionamento das datas

- D0 é calculado pela data da venda.
- Enquanto não houver entrega, D7 funciona como atualização da ordem de serviço.
- Após preencher a entrega real, D7, D21, 3 meses, 6 meses e 1 ano são recalculados a partir dela.
- Na ausência da entrega real, o sistema usa o prazo informado e, por último, a data da venda.

## Armazenamento e backup

Os clientes e scripts ficam no `localStorage` do navegador. Isso significa que:

- os dados não são sincronizados entre computadores;
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

## Desenvolvimento

O projeto usa somente HTML, CSS e JavaScript, sem dependências:

```bash
python3 -m http.server 8080
```

Depois, acesse `http://localhost:8080`.
