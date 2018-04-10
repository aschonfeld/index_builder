FROM docker.niartifactory.maninvestments.com/base/numeric-python:27-1-onbuild
MAINTAINER Man | Numeric Investments

ARG WORKDIR=grail
ENV LOG_CONFIG=/grail/log_app.cfg

RUN set -x \
  ; yum clean all \
  ; yum -y install --nogpgcheck \
#
    liberation-sans-fonts.noarch \
    nodejs.x86_64 \
#
# install yarn
  ; withproxy curl -Ls https://dl.yarnpkg.com/rpm/yarn.repo > /etc/yum.repos.d/yarn.repo \
  ; withproxy yum -y install yarn.noarch \
  ; rm /etc/yum.repos.d/yarn.repo \
#
  ; yum clean all \
  ; rm -rf /var/{cache,lib}/{yum,apt,dpkg,cache,log}/ \
  ; rpm --rebuilddb

# install all the packages needed to build, run and test
COPY docker/develop/docker-entrypoint.sh .
RUN chmod 755 docker-entrypoint.sh \
 && mkdir /$WORKDIR

COPY requirements.* /$WORKDIR
WORKDIR /$WORKDIR

USER $USER
RUN for i in requirements.*; do pip install --no-cache-dir -r $i; done

VOLUME [ "/${WORKDIR}" ]
ENTRYPOINT [ "tini", "--", "/docker-entrypoint.sh" ]
