##############################################################################
#
# Copyright (c) 2011 Vifib SARL and Contributors. All Rights Reserved.
#
# WARNING: This program as such is intended to be used by professional
# programmers who take the whole responsibility of assessing all potential
# consequences resulting from its eventual inadequacies and bugs
# End users who are looking for a ready-to-use solution with commercial
# guarantees and support are strongly adviced to contract a Free Software
# Service Company
#
# This program is Free Software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 3
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
#
##############################################################################
from slapos.recipe.librecipe import GenericBaseRecipe

class Recipe(GenericBaseRecipe):
  """
  haproxy instance configuration.

  name -- local name of the haproxy

  wrapper-path -- location of the init script to generate

  binary-path -- location of the haproxy command

  conf-path -- location of the configuration file

  ip -- ip of the haproxy server

  port -- port of the haproxy server

  server-check-path -- path of the domain to check

  address -- string with list of all url to check
    Example: 127.0.0.1:12004 127.0.0.1:12005
  """

  def install(self):
    # inter must be quite short in order to detect quickly an unresponsive node
    #      and to detect quickly a node which is back
    # rise must be minimal possible : 1, indeed, a node which is back don't need
    #      to sleep more time and we can give him work immediately
    # fall should be quite sort. with inter at 3, and fall at 2, a node will be
    #      considered as dead after 6 seconds.
    # maxconn should be set as the maximum thread we have per zope, like this
    #      haproxy will manage the queue of request with the possibility to
    #      move a request to another node if the initially selected one is dead
    # maxqueue is the number of waiting request in the queue of every zope client.
    #      It allows to make sure that there is not a zope client handling all
    #      the work while other clients are doing nothing. This was happening
    #      even thoug we have round robin distribution because when a node dies
    #      some seconds, all request are dispatched to other nodes, and then users
    #      stick in other nodes and are not coming back. Please note this option
    #      is not an issue if you have more than (maxqueue * node_quantity) requests
    #      because haproxy will handle a top-level queue

    if self.options.get('no-timeout', ''):
      snippet_filename = self.getTemplateFilename(
                                      'haproxy-no-timeout-server-snippet.cfg.in')
      template_filename = self.getTemplateFilename('haproxy-no-timeout.cfg.in')
    else:
      snippet_filename = self.getTemplateFilename(
                                      'haproxy-server-snippet.cfg.in')
      template_filename = self.getTemplateFilename('haproxy.cfg.in')

    # Prepare all filestorages
    server_snippet = ""
    i = 0
    name = self.options['name']
    for address in self.options['backend-list'].split():
      i += 1
      server_snippet += self.substituteTemplate(
          snippet_filename, dict(
             name='%s_%s' % (name, i), 
             address=address,
             cluster_zope_thread_amount=self.options['maxconn']))

    config = dict(
        name=name, 
        ip=self.options['ip'], 
        port=self.options['port'],
        server_text=server_snippet,
        server_check_path=self.options['server-check-path'],)
    configuration_path = self.createFile(
        self.options['conf-path'],
        self.substituteTemplate(template_filename, config))

    # Create running wrapper
    wrapper_path = self.createPythonScript(
      self.options['wrapper-path'],
      'slapos.recipe.librecipe.execute.execute',
      arguments=[self.options['binary-path'].strip(), '-f', configuration_path],)

    return [configuration_path, wrapper_path]
