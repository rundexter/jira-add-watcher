var JiraApi = require('jira').JiraApi,
    querystring = require('querystring'),
    _ = require('lodash');

module.exports = {

    /**
     * Return auth object.
     *
     *
     * @param dexter
     * @returns {*}
     */
    authParams: function (dexter) {
        var auth = {
            protocol: dexter.environment('jira_protocol', 'https'),
            host: dexter.environment('jira_host'),
            port: dexter.environment('jira_port', 443),
            user: dexter.environment('jira_user'),
            password: dexter.environment('jira_password'),
            apiVers: dexter.environment('jira_apiVers', '2')
        };

        if (!dexter.environment('jira_host') || !dexter.environment('jira_user') || !dexter.environment('jira_password')) {

            this.fail('A [jira_protocol, jira_port, jira_apiVers, *jira_host, *jira_user, *jira_password] environment has this module (* - required).');

            return false;
        } else {

            return auth;
        }
    },

    processStatus: function (error, response) {

        if (error) {
            this.fail(error, null);
            return;
        }

        if (response.statusCode === 400) {

            this.fail(response.statusCode + ': Returned if there is a problem with the received user representation.');
            return;
        }

        if (response.statusCode === 401) {

            this.fail(response.statusCode + ': Returned if the calling user does not have permission to add the watcher to the issue\'s list of watchers.');
            return;
        }

        if (response.statusCode === 404) {

            this.fail(response.statusCode + ': Returned if either the issue or the user does not exist.');
            return;
        }

        if (response.statusCode === 204) {

            this.complete({success: true});
            return;
        }

        this.fail(response.statusCode + ': something is happened');
    },

    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {

        var issue = step.input('issue').first();
        var username = step.input('username').first();

        if (issue && username) {

            var jiraUri = '/issue/' + issue + '/watchers';
            var auth = this.authParams(dexter);
            var jira = new JiraApi(auth.protocol, auth.host, auth.port, auth.user, auth.password, auth.apiVers);


            var options = {
                rejectUnauthorized: this.strictSSL,
                uri: jira.makeUri(jiraUri),
                method: 'POST',
                followAllRedirects: true,
                json: true,
                body: '"' + username + '"'
            };

            jira.doRequest(options, function (error, response, body) {

                this.processStatus(error, response, body);
            }.bind(this));
        } else {

            this.fail('A [issue, username] inputs need for this module');
        }
    }
};
