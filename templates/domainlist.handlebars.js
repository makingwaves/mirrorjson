let tpl = `
{{#if results}}
    <ul>
        {{#results}}
            <li>
                <a href="http://{{localDomain}}">{{localDomain}}</a>
                <=
                <a href="http://{{remoteDomain}}">{{remoteDomain}}</a>
                (<a href="/mirrorjson/{{localDomain}}">{{#if (lookup ../countDocs this._id)}}{{lookup ../countDocs this._id}}{{else}}0{{/if}} stored elements</a>)
            </li>
        {{/results}}
    </ul>
{{else}}
    <p>No external API registered</p>
{{/if}}

<h2>Add a new external API domain for '{{currentLocal}}'</h2>
<p>
    <form method="POST" action="/mirrorjson">
        <label>Domain:</label>
        <input type="text" name="domain" value="{{currentRemote}}" />
        <input type="submit" value="Save domain" />
    </form>
</p>
{{#if currentRemote}}
    <p>
        <form method="POST" action=".">
            <input type="submit" name="remove_domain" value="Remove current domain '{{currentRemote}}'" />
        </form>
    </p>
{{/if}}
`;

let headerTpl = require('../templates/header.handlebars');
let footerTpl = require('../templates/footer.handlebars');
exports.tpl = () => headerTpl.tpl() + tpl + footerTpl.tpl();
